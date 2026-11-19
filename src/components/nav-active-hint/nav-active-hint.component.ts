import { ChangeDetectionStrategy, Component, computed, effect, ElementRef, inject, input, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { HubNavOutOfViewHint } from '../../models/nav-config.model';
import { HubNavItem } from '../../models/nav-item.model';
import { HubNavStateService } from '../../services/nav-state.service';

/** Side of the scroll container the active item has left through. */
export type HubNavActiveHintSide = 'before' | 'after';

/**
 * Pill docked to the edge of the root list's scroll container while the active item
 * sits outside it, pointing the way back. Activating it scrolls the container — and only
 * the container — until the item is centred, then hands focus to the item itself.
 *
 * Nothing is tracked per frame. The verdict is recomputed after a scroll of the
 * container, a resize of it, or a class change under it (the active mark moving, a
 * section opening), coalesced into one animation frame.
 *
 * @internal Rendered by `HubNavComponent` when `config.outOfViewHint` is not `'off'`.
 */
@Component({
	selector: 'hub-nav-active-hint',
	standalone: true,
	imports: [NgTemplateOutlet],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: {
		class: 'hub-nav-active-hint',
		'[class.hub-nav-active-hint--before]': 'side() === "before"',
		'[class.hub-nav-active-hint--after]': 'side() === "after"',
		'[class.hub-nav-active-hint--horizontal]': 'horizontal()',
		'[class.hub-nav-active-hint--hover]': 'mode() === "hover"',
		'[style.top.px]': 'box()?.top ?? null',
		'[style.left.px]': 'box()?.left ?? null',
		'[style.width.px]': 'box()?.width ?? null',
		'[style.height.px]': 'box()?.height ?? null'
	},
	template: `
		@if (side() && activeItem(); as item) {
			<button type="button" class="hub-nav-active-hint__button" [attr.aria-label]="label()" (click)="reveal()">
				<span class="hub-nav-active-hint__arrow" aria-hidden="true"></span>
				@if (item.icon) {
					@if (state.iconTemplate(); as projected) {
						<span class="hub-nav-active-hint__icon" aria-hidden="true">
							<ng-container
								[ngTemplateOutlet]="projected"
								[ngTemplateOutletContext]="{ $implicit: item, rail: compact() }"
							/>
						</span>
					} @else {
						<span class="hub-nav-active-hint__icon" [class]="item.icon" aria-hidden="true"></span>
					}
				}
				@if (!compact() || !item.icon) {
					<span class="hub-nav-active-hint__label" aria-hidden="true">{{
						compact() ? item.label.charAt(0) : item.label
					}}</span>
				}
			</button>
		}
	`,
	styleUrl: './nav-active-hint.component.scss'
})
export class HubNavActiveHintComponent {
	/** Element that scrolls the root items. Null while the nav renders no root list. */
	readonly container = input<HTMLElement | null>(null);

	/** Root items, used to name the active entry inside the pill. */
	readonly items = input<HubNavItem[]>([]);

	/** Router URL the active state is resolved against. */
	readonly url = input<string>('');

	/** `'hover'` shows the pill only while the pointer or focus is inside the nav. */
	readonly mode = input<HubNavOutOfViewHint>('always');

	protected readonly state = inject(HubNavStateService);
	private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

	/** Edge the active item has left through, or null while it is in view. */
	readonly side = signal<HubNavActiveHintSide | null>(null);

	/** Container box in the coordinates of the positioned parent both elements share. */
	readonly box = signal<{ top: number; left: number; width: number; height: number } | null>(null);

	readonly horizontal = computed(() => this.state.orientation() === 'horizontal');

	/** The rail leaves room for a glyph only. */
	readonly compact = computed(() => this.state.railActive());

	/**
	 * Deepest active entry of the menu. Inside a collapsed section the pill points at the
	 * section's row but names the entry the reader is actually on.
	 */
	readonly activeItem = computed(() => {
		const url = this.url();
		let level = this.items();
		let found: HubNavItem | null = null;

		while (level.length) {
			const siblings = level;
			const hit = siblings.find(
				(item) => item.type !== 'separator' && this.state.isItemActiveAmongSiblings(item, siblings, url)
			);
			if (!hit) {
				break;
			}
			found = hit;
			level = hit.children ?? [];
		}

		return found;
	});

	readonly label = computed(() => this.state.labels().scrollToActive.replace('{label}', this.activeItem()?.label ?? ''));

	private frame = 0;

	constructor() {
		effect((onCleanup) => {
			const container = this.container();
			// Re-measure when the active entry changes even if no class under the container does.
			this.activeItem();
			// No container, or no layout to measure (server rendering): nothing to point at.
			if (!container || typeof requestAnimationFrame !== 'function') {
				this.side.set(null);
				return;
			}

			const schedule = (): void => {
				if (!this.frame) {
					this.frame = requestAnimationFrame(() => {
						this.frame = 0;
						this.measure(container);
					});
				}
			};

			container.addEventListener('scroll', schedule, { passive: true });
			const resize = typeof ResizeObserver === 'function' ? new ResizeObserver(schedule) : null;
			resize?.observe(container);
			const mutation = typeof MutationObserver === 'function' ? new MutationObserver(schedule) : null;
			mutation?.observe(container, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });
			schedule();

			onCleanup(() => {
				container.removeEventListener('scroll', schedule);
				resize?.disconnect();
				mutation?.disconnect();
				cancelAnimationFrame(this.frame);
				this.frame = 0;
			});
		});
	}

	/**
	 * Scrolls the container until the active item is centred on its axis and moves focus
	 * onto it, so a keyboard user lands where the pill pointed instead of on the body.
	 */
	reveal(): void {
		const container = this.container();
		const target = container && this.findTarget(container);
		if (!container || !target) {
			return;
		}

		const box = container.getBoundingClientRect();
		const rect = target.getBoundingClientRect();
		const behavior: ScrollBehavior = this.host.ownerDocument.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)')
			.matches
			? 'auto'
			: 'smooth';

		if (this.horizontal()) {
			container.scrollBy({ left: rect.left - box.left - (box.width - rect.width) / 2, behavior });
		} else {
			container.scrollBy({ top: rect.top - box.top - (box.height - rect.height) / 2, behavior });
		}

		target.querySelector<HTMLElement>('a, button, [tabindex]')?.focus({ preventScroll: true });
	}

	/**
	 * The innermost rendered active row. Ancestors of the active entry carry the mark too,
	 * so a collapsed section leaves its own row as the last visible one.
	 */
	private findTarget(container: HTMLElement): HTMLElement | null {
		const marked = Array.from(container.querySelectorAll<HTMLElement>('hub-nav-item.hub-nav-item--active'));

		return marked.reverse().find((el) => el.getClientRects().length > 0) ?? null;
	}

	/** Decides whether the active row is out of view and on which side; docks the pill there. */
	private measure(container: HTMLElement): void {
		const target = this.findTarget(container);
		if (!target) {
			this.side.set(null);
			return;
		}

		const box = container.getBoundingClientRect();
		const rect = target.getBoundingClientRect();
		// Half the row hidden counts as out of view: past that the reader no longer sees which entry it is.
		const centre = this.horizontal() ? rect.left + rect.width / 2 : rect.top + rect.height / 2;
		const start = this.horizontal() ? box.left : box.top;
		const end = this.horizontal() ? box.right : box.bottom;

		this.side.set(centre < start ? 'before' : centre > end ? 'after' : null);

		// The container and this element share their positioned parent (the primary column or the
		// horizontal top row), so its offsets are this element's coordinates, untouched by page scroll.
		this.box.set({
			top: container.offsetTop,
			left: container.offsetLeft,
			width: container.offsetWidth,
			height: container.offsetHeight
		});
	}
}
