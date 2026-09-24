import { isPlatformBrowser } from '@angular/common';
import {
	AfterViewInit,
	Directive,
	ElementRef,
	NgZone,
	OnDestroy,
	PLATFORM_ID,
	computed,
	effect,
	inject,
	input,
	output,
	signal
} from '@angular/core';
import { HubNavComponent } from '../components/nav/nav.component';
import { HubNavItem } from '../models/nav-item.model';

/**
 * Scroll spy container directive that tracks the currently visible section and
 * emits section changes using `IntersectionObserver`.
 */
@Directive({
	selector: '[hubNavScrollSpy]',
	standalone: true,
	exportAs: 'hubNavScrollSpy'
})
export class HubNavScrollSpyDirective implements AfterViewInit, OnDestroy {
	/** Enables or disables section tracking. */
	readonly enabled = input<boolean>(true, { alias: 'hubNavScrollSpy' });

	/** Top offset in pixels to compensate sticky headers. */
	readonly offset = input<number>(120);

	/** CSS selector used to locate section elements inside the host container. */
	readonly sectionSelector = input<string>('[data-hub-nav-scroll-spy-section]');

	/**
	 * The nav this spy answers for. Bound, the two halves join up: the section under the
	 * reader marks the matching entry — by `id` or by `fragment`, and without writing a
	 * URL — and a click on an entry scrolls here.
	 *
	 * Left unbound the spy only reports through `activeSectionChange`, which is what
	 * every consumer then had to turn into a mark by hand.
	 */
	readonly nav = input<HubNavComponent | null>(null);

	/**
	 * The element these sections actually scroll in, when it is not the one the spy would
	 * find by walking up from them — an application shell that scrolls its own column,
	 * a container that only becomes scrollable once its content arrives.
	 *
	 * It is also what `scrollTo` moves. The old implementation asked the browser to bring
	 * the section into view, and the browser obliges by scrolling every ancestor that can
	 * scroll: the shell slid under its own header, and a page inside an overflowing
	 * wrapper travelled sideways.
	 */
	readonly scrollContainer = input<HTMLElement | null>(null);

	/**
	 * How long, in milliseconds, a click's answer survives the reader appearing to
	 * take over.
	 *
	 * A click already pins the section it asked for until the reader scrolls under their
	 * own steam — but the smooth scroll it starts passes under the pointer, and one
	 * notch of a wheel or a stray touch hands the question straight back to the geometry
	 * mid-flight, landing the mark somewhere between where they were and where they
	 * asked to be. During this window those events are ignored.
	 *
	 * `0`, the default, keeps the previous behaviour. Consumers that hit this settled on
	 * roughly a second.
	 */
	readonly clickSettleMs = input<number>(0);

	/** Emits the active section id whenever it changes. */
	readonly activeSectionChange = output<string>();

	private readonly el = inject(ElementRef<HTMLElement>);
	private readonly zone = inject(NgZone);

	/** Section tracking relies on browser-only APIs (rAF, IntersectionObserver); inert on the server. */
	private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

	private observer: IntersectionObserver | null = null;

	/** Sections currently inside the observation band. */
	private readonly intersecting = new Set<HTMLElement>();

	/** Detaches the scroll listener that catches the end of the container. */
	private detachScroll?: () => void;

	/**
	 * Section the reader asked for, which outranks anything the geometry infers.
	 *
	 * A spy exists to answer "where am I" while nobody is steering. The moment somebody
	 * clicks an entry they have answered it themselves, and the scroll that follows is a
	 * consequence of their choice rather than new information — so inferring from it
	 * argues with them. Worse, near the end of a page it argues and wins: several
	 * sections share the last screen, and no threshold can tell which of them was meant.
	 *
	 * Held until the reader scrolls under their own steam, which is the point at which
	 * the question becomes theirs again.
	 */
	private pinnedId: string | null = null;

	/** Detaches the listeners that tell us the reader has taken over. */
	private detachIntent?: () => void;

	/** Whether the quiet period after a click is still running. See {@link clickSettleMs}. */
	private settling = false;

	/** Pending end of that quiet period. */
	private settleTimer?: ReturnType<typeof setTimeout>;

	/**
	 * Slack for "the container has nothing left to scroll". Fractional layouts and zoom
	 * leave the last pixel or two unreachable, and an exact comparison never fires.
	 */
	private static readonly END_SLACK_PX = 2;
	private activeId = signal<string | null>(null);
	private initialized = signal<boolean>(false);

	/** Current active section id (readonly signal). */
	readonly activeSectionId = computed(() => this.activeId());

	private readonly configEffect = effect(() => {
		if (!this.initialized()) {
			return;
		}

		const isEnabled = this.enabled();
		const topOffset = this.offset();
		const selector = this.sectionSelector();
		// A new container is a new element to listen on, so the observer is rebuilt for it.
		const container = this.scrollContainer();
		void topOffset;
		void selector;
		void container;

		if (!isEnabled) {
			this.destroyObserver();
			return;
		}

		this.scheduleInit();
	});

	/**
	 * Marks the bound nav's entry for the section under the reader.
	 *
	 * Through the nav's own `activeItemId` rather than a URL: naming a section by
	 * replacing the URL is a documentation-site convention, not a general one, and it
	 * costs a router navigation and a history entry per section the reader passes.
	 */
	private readonly navMarkEffect = effect(() => {
		this.nav()?.activeItemId.set(this.activeId());
	});

	/**
	 * Scrolls here when an entry of the bound nav is clicked.
	 *
	 * The entry names its section through `fragment` or, failing that, its own `id`.
	 * An entry that names no tracked section is left alone — a link to another page
	 * still navigates, and nothing here interferes.
	 */
	private readonly navClickEffect = effect((onCleanup) => {
		const nav = this.nav();

		if (!nav) {
			return;
		}

		const subscription = nav.itemClick.subscribe((item: HubNavItem) => this.scrollTo(item.fragment ?? item.id));

		onCleanup(() => {
			subscription.unsubscribe();
			nav.activeItemId.set(null);
		});
	});

	/** @inheritDoc */
	ngAfterViewInit(): void {
		this.initialized.set(true);
		if (this.enabled()) {
			this.scheduleInit();
		}
	}

	/** @inheritDoc */
	ngOnDestroy(): void {
		this.destroyObserver();
	}

	/**
	 * Scrolls to a tracked section by id.
	 *
	 * @param sectionId - Target section id.
	 * @param behavior - Native scroll behavior.
	 * @returns `true` when the target exists and scroll was requested.
	 */
	scrollTo(sectionId: string, behavior: ScrollBehavior = 'smooth'): boolean {
		const target = this.getSectionElements().find((element) => this.getSectionId(element) === sectionId);
		if (!target) {
			return false;
		}

		// Their answer, not ours, until they move the page themselves.
		this.pin(sectionId);

		if (sectionId !== this.activeId()) {
			this.activeId.set(sectionId);
			this.activeSectionChange.emit(sectionId);
		}

		this.scrollToElement(target, behavior);
		return true;
	}

	/**
	 * Holds a section as the answer, and starts the window in which the reader's own
	 * gestures do not overturn it.
	 *
	 * @param sectionId - Section the reader asked for.
	 */
	private pin(sectionId: string): void {
		this.pinnedId = sectionId;
		clearTimeout(this.settleTimer);

		const settle = this.clickSettleMs();

		if (settle <= 0) {
			this.settling = false;
			return;
		}

		this.settling = true;
		this.settleTimer = setTimeout(() => {
			this.settling = false;
		}, settle);
	}

	/**
	 * Scrolls one container to put a section under the reader, offset included.
	 *
	 * Deliberately not `scrollIntoView`: it scrolls every ancestor that can scroll, so
	 * an application shell moved under its own header to satisfy a jump inside the
	 * column. Computing the offset here is also what lets the sticky compensation the
	 * observer already uses apply to the jump, which `scrollIntoView` has no way to take.
	 *
	 * @param target - Section element to bring to the top of the container.
	 * @param behavior - Native scroll behavior.
	 */
	private scrollToElement(target: HTMLElement, behavior: ScrollBehavior): void {
		const scroller = this.resolveScroller();
		const targetTop = target.getBoundingClientRect().top;

		if (!scroller || scroller === document.scrollingElement) {
			window.scrollTo({ top: Math.max(0, window.scrollY + targetTop - this.offset()), behavior });
			return;
		}

		const top = scroller.scrollTop + targetTop - scroller.getBoundingClientRect().top - this.offset();
		scroller.scrollTo({ top: Math.max(0, top), behavior });
	}

	/** The container this spy reads and moves: the declared one, or the one it can find. */
	private resolveScroller(): HTMLElement | null {
		return this.scrollContainer() ?? this.scrollParent();
	}

	private scheduleInit(): void {
		if (!this.isBrowser) {
			return;
		}

		this.zone.runOutsideAngular(() => {
			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					this.zone.run(() => this.initializeObserver());
				});
			});
		});
	}

	private initializeObserver(): void {
		this.destroyObserver();

		const sections = this.getSectionElements();
		if (sections.length === 0) {
			return;
		}

		const topOffset = this.offset();
		this.observer = new IntersectionObserver((entries) => this.handleObserverEntries(entries), {
			root: null,
			rootMargin: `-${topOffset}px 0px -55% 0px`,
			threshold: [0.05, 0.2, 0.4, 0.6, 0.8]
		});

		sections.forEach((section) => this.observer?.observe(section));
		this.observeScrollEnd();
	}

	private destroyObserver(): void {
		this.observer?.disconnect();
		this.observer = null;
		this.intersecting.clear();
		this.detachScroll?.();
		this.detachScroll = undefined;
		this.detachIntent?.();
		this.detachIntent = undefined;
		this.pinnedId = null;
		clearTimeout(this.settleTimer);
		this.settling = false;
	}

	/**
	 * Watches for the container reaching its end, which no intersection ever announces:
	 * the sections below the band stop moving, so nothing changes and nothing fires.
	 */
	private observeScrollEnd(): void {
		const scroller = this.resolveScroller();
		const target: EventTarget = scroller === document.scrollingElement ? window : (scroller ?? window);
		let queued = false;

		const onScroll = () => {
			if (queued) {
				return;
			}

			queued = true;
			requestAnimationFrame(() => {
				queued = false;
				this.zone.run(() => this.syncActiveSection());
			});
		};

		this.zone.runOutsideAngular(() => target.addEventListener('scroll', onScroll, { passive: true }));
		this.detachScroll = () => target.removeEventListener('scroll', onScroll);
		this.observeReaderIntent();
	}

	/**
	 * Watches for the reader taking the page over, which releases {@link pinnedId}.
	 *
	 * Deliberately not the `scroll` event: the smooth scroll a click starts fires that
	 * too, and releasing on it would hand control straight back to the geometry we were
	 * trying to overrule. A wheel, a drag or a key is the reader; a scroll is anybody.
	 */
	private observeReaderIntent(): void {
		const release = () => {
			if (this.settling) {
				return;
			}
			this.pinnedId = null;
		};
		const events: Array<keyof WindowEventMap> = ['wheel', 'touchmove', 'keydown'];

		this.zone.runOutsideAngular(() => events.forEach((name) => window.addEventListener(name, release, { passive: true })));
		this.detachIntent = () => events.forEach((name) => window.removeEventListener(name, release));
	}

	private getSectionElements(): HTMLElement[] {
		return Array.from(this.el.nativeElement.querySelectorAll(this.sectionSelector())).filter(
			(node): node is HTMLElement => node instanceof HTMLElement
		);
	}

	private getSectionId(element: HTMLElement): string | null {
		return element.getAttribute('data-hub-nav-scroll-spy-section') ?? element.id ?? null;
	}

	private handleObserverEntries(entries: IntersectionObserverEntry[]): void {
		for (const entry of entries) {
			const section = entry.target as HTMLElement;

			if (entry.isIntersecting) {
				this.intersecting.add(section);
			} else {
				this.intersecting.delete(section);
			}
		}

		this.syncActiveSection();
	}

	/**
	 * Decides which section the reader is on, out of the ones currently in the band.
	 *
	 * Two rules, each of which the ratio-only version got wrong:
	 *
	 * 1. **The topmost wins, not the largest slice.** Ranking by `intersectionRatio` ranks
	 *    by how much of a section fits the band, so a short one sitting entirely inside it
	 *    outranks the tall one the reader is actually in the middle of — and the mark
	 *    jumps back and forth between them as the tall one scrolls through.
	 * 2. **At the end of the scroll, the last section wins outright.** The band stops
	 *    partway down the viewport, so once the container cannot scroll any further,
	 *    everything below that line is unreachable: the final sections could never be
	 *    reported at all, however long the reader stared at them. Measured on a
	 *    seven-example page, clicking the last entry settled the mark four items above it.
	 */
	private syncActiveSection(): void {
		if (this.pinnedId) {
			return;
		}

		const sections = this.getSectionElements();

		if (sections.length === 0) {
			return;
		}

		const chosen = this.isScrolledToEnd()
			? sections[sections.length - 1]
			: [...this.intersecting].sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top)[0];

		if (!chosen) {
			return;
		}

		const id = this.getSectionId(chosen);
		if (!id || id === this.activeId()) {
			return;
		}

		this.activeId.set(id);
		this.activeSectionChange.emit(id);
	}

	/** Whether the surface these sections scroll in has nothing left to give. */
	private isScrolledToEnd(): boolean {
		const scroller = this.resolveScroller();

		if (!scroller) {
			return false;
		}

		return scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - HubNavScrollSpyDirective.END_SLACK_PX;
	}

	/**
	 * The scrollable ancestor these sections actually move inside — often not the window,
	 * since an application shell usually scrolls its own main column.
	 *
	 * @returns The nearest scrolling ancestor, or the document's scroller.
	 */
	private scrollParent(): HTMLElement | null {
		let node: HTMLElement | null = this.el.nativeElement.parentElement;

		while (node) {
			const overflowY = getComputedStyle(node).overflowY;

			if ((overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > node.clientHeight) {
				return node;
			}

			node = node.parentElement;
		}

		return (document.scrollingElement as HTMLElement | null) ?? null;
	}
}
