import { Component, ChangeDetectionStrategy, input, output, computed, TemplateRef, ElementRef, inject } from '@angular/core';
import { HubNavStateService } from '../../services/nav-state.service';
import { HUB_NAV_DEFAULT_LABELS } from '../../models/nav-labels.model';
import { HubNavDropdownRenderMode } from '../../models/nav-config.model';
import { HubNavItem } from '../../models/nav-item.model';
import { HubNavPanelState } from '../../models/nav-panel-state.model';
import { HubNavItemListComponent } from '../nav-item-list/nav-item-list.component';

/**
 * Renders a single side panel in the stacked panel navigation.
 * Contains a header with the parent item's label (plus back/close buttons)
 * and a body with a `hub-nav-item-list` for the panel's items.
 *
 * Includes keyboard navigation:
 * - **Escape**: closes the panel and returns focus to the parent trigger.
 * - **ArrowLeft**: navigates back (if drill-down) or closes the panel.
 *
 * @internal Used internally by `HubNavPanelContainerComponent`.
 */
@Component({
	selector: 'hub-nav-panel',
	standalone: true,
	imports: [HubNavItemListComponent],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: {
		class: 'hub-nav-panel',
		'[class.hub-nav-panel--drill-down]': 'panel().isDrillDown',
		'[class.hub-nav-panel--last]': 'isLast()',
		'[style.width]': 'panelWidth()',
		role: 'navigation',
		'[attr.aria-label]': 'ariaLabel()',
		tabindex: '-1',
		'(keydown)': 'onKeyDown($event)'
	},
	templateUrl: './nav-panel.component.html',
	styleUrl: './nav-panel.component.scss'
})
export class HubNavPanelComponent {
	/** The panel state to render. */
	readonly panel = input.required<HubNavPanelState>();

	/** Width of this panel (CSS value). */
	readonly panelWidth = input<string>('16rem');

	/** Whether this is the outermost visible panel in a vertical panel stack. */
	readonly isLast = input<boolean>(false);

	/** Optional custom template for rendering item content. */
	readonly itemTemplate = input<TemplateRef<unknown> | null>(null);

	/** Dropdown rendering mode forwarded to the panel item list. */
	readonly dropdownRenderMode = input<HubNavDropdownRenderMode>('inline');

	/** Unique owner class used to scope overlay dropdowns. */
	readonly overlayOwnerClass = input<string>('');

	/** Orientation class forwarded to overlay dropdowns rendered inside the panel. */
	readonly overlayOrientationClass = input<'hub-nav--horizontal' | 'hub-nav--vertical'>('hub-nav--vertical');

	/**
	 * Controls whether the panel header is rendered.
	 * Used by horizontal layouts to avoid duplicating the selected root item
	 * title when that item is already visible in the top row.
	 */
	readonly showHeader = input<boolean>(true);

	/** Emitted when the panel close button is clicked. Carries the panel ID. */
	readonly closePanel = output<string>();

	/** Emitted when the back button is clicked. Carries the panel ID. */
	readonly backClick = output<string>();

	/** Emitted when an item in the panel is clicked. */
	readonly itemClick = output<{ item: HubNavItem; event: Event }>();

	/** Emitted when a dropdown toggle is requested within the panel. */
	readonly dropdownToggle = output<HubNavItem>();

	/** Emitted when an item with panel expand mode is clicked (needs a new panel). */
	readonly panelOpen = output<HubNavItem>();

	/** Host element reference. */
	private readonly el = inject(ElementRef<HTMLElement>);

	/**
	 * Owning nav state, absent when the panel is instantiated standalone;
	 * labels then fall back to the English defaults.
	 */
	private readonly state = inject(HubNavStateService, { optional: true });

	/** Accessible label of the back button, resolved through the nav labels. */
	readonly backLabel = computed(() => this.state?.labels().goBack ?? HUB_NAV_DEFAULT_LABELS.goBack);

	/** Accessible label of the close button, resolved through the nav labels. */
	readonly closeLabel = computed(() => this.state?.labels().closePanel ?? HUB_NAV_DEFAULT_LABELS.closePanel);

	/** The label displayed in the panel header. */
	readonly currentLabel = computed(() => this.panel().parentItem.label);

	/** Accessible label for the panel navigation landmark. */
	readonly ariaLabel = computed(() => `${this.panel().parentItem.label} navigation`);

	/**
	 * Handles keyboard events for panel navigation.
	 *
	 * @param event - The keyboard event.
	 */
	onKeyDown(event: KeyboardEvent): void {
		switch (event.key) {
			case 'Escape':
				event.preventDefault();
				event.stopPropagation();
				this.closePanel.emit(this.panel().id);
				break;

			case 'ArrowLeft':
				// Only handle ArrowLeft at the panel level (not inside item-list submenus)
				if (this.isDirectPanelFocus(event.target as HTMLElement)) {
					event.preventDefault();
					event.stopPropagation();
					if (this.panel().isDrillDown) {
						this.backClick.emit(this.panel().id);
					} else {
						this.closePanel.emit(this.panel().id);
					}
				}
				break;

			default:
				return;
		}
	}

	/**
	 * Handles close button click.
	 */
	onCloseClick(): void {
		this.closePanel.emit(this.panel().id);
	}

	/**
	 * Handles back button click for drill-down navigation.
	 */
	onBackClick(): void {
		this.backClick.emit(this.panel().id);
	}

	/**
	 * Forwards item click events from the inner item list.
	 *
	 * @param payload - The clicked item and DOM event.
	 */
	onItemClick(payload: { item: HubNavItem; event: Event }): void {
		this.itemClick.emit(payload);
	}

	/**
	 * Forwards dropdown toggle events from the inner item list.
	 *
	 * @param item - The dropdown item that was toggled.
	 */
	onDropdownToggle(item: HubNavItem): void {
		this.dropdownToggle.emit(item);
	}

	/**
	 * Forwards panel open events from the inner item list.
	 *
	 * @param item - The item requesting a new panel.
	 */
	onPanelOpen(item: HubNavItem): void {
		this.panelOpen.emit(item);
	}

	/**
	 * Focuses the first focusable item inside this panel.
	 */
	focusFirstItem(): void {
		requestAnimationFrame(() => {
			const firstItem = this.el.nativeElement.querySelector(
				'.hub-nav-item__link, .hub-nav-item__caret-button, .hub-nav-item__dropdown-toggle'
			) as HTMLElement | null;
			firstItem?.focus();
		});
	}

	/**
	 * Checks whether the event target is a direct child of this panel's item-list
	 * (not inside a nested flyout/accordion submenu rendered by descendants).
	 *
	 * @param target - The DOM element that received the event.
	 * @returns `true` if the target belongs directly to this panel's navigation items.
	 */
	private isDirectPanelFocus(target: HTMLElement): boolean {
		const owningList = target.closest('hub-nav-item-list');
		const directList = this.el.nativeElement.querySelector(':scope > .hub-nav-panel__body > hub-nav-item-list');

		return !!owningList && owningList === directList;
	}
}
