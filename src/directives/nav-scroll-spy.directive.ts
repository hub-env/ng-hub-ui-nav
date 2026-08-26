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
		void topOffset;
		void selector;

		if (!isEnabled) {
			this.destroyObserver();
			return;
		}

		this.scheduleInit();
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
		this.pinnedId = sectionId;

		if (sectionId !== this.activeId()) {
			this.activeId.set(sectionId);
			this.activeSectionChange.emit(sectionId);
		}

		target.scrollIntoView({
			behavior,
			block: 'start',
			inline: 'nearest'
		});
		return true;
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
	}

	/**
	 * Watches for the container reaching its end, which no intersection ever announces:
	 * the sections below the band stop moving, so nothing changes and nothing fires.
	 */
	private observeScrollEnd(): void {
		const scroller = this.scrollParent();
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
		const scroller = this.scrollParent();

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
