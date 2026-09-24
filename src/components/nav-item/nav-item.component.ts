import { Component, ChangeDetectionStrategy, input, output, inject, computed, TemplateRef } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HubOverflowTooltipDirective, HubTooltipDirective } from 'ng-hub-ui-utils';
import { HubNavItem } from '../../models/nav-item.model';
import { HubNavItemIconContext } from '../../models/nav-template-context.model';
import { HubNavStateService } from '../../services/nav-state.service';

/**
 * Renders a single navigation item (link, dropdown trigger, header, or custom content).
 * Handles routing integration, active state, badges, icons, and disabled state.
 *
 * @internal Used internally by `HubNavItemListComponent`.
 */
@Component({
	selector: 'hub-nav-item',
	standalone: true,
	imports: [NgTemplateOutlet, RouterLink, HubOverflowTooltipDirective, HubTooltipDirective],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: {
		class: 'hub-nav-item',
		'[class.hub-nav-item--active]': 'isActive()',
		'[class.hub-nav-item--disabled]': 'item().disabled',
		'[class.hub-nav-item--has-children]': 'hasChildren()',
		'[class.hub-nav-item--expanded]': 'isExpanded()',
		'[class.hub-nav-item--header]': 'isHeader()',
		'[class]': 'item().cssClass ?? ""',
		'[attr.data-item-id]': 'item().id',
		role: 'none'
	},
	templateUrl: './nav-item.component.html',
	styleUrl: './nav-item.component.scss'
})
export class HubNavItemComponent {
	/** The navigation item data to render. */
	readonly item = input.required<HubNavItem>();

	/** Nesting depth (0 = root). */
	readonly depth = input<number>(0);

	/** Whether this item is currently active (set by parent list). */
	readonly isActive = input<boolean>(false);

	/** Whether the dropdown is currently expanded (only for dropdown items). */
	readonly isExpanded = input<boolean>(false);

	/** Optional custom template for rendering the item content. */
	readonly itemTemplate = input<TemplateRef<unknown> | null>(null);

	/**
	 * Forces the item to behave as part of a mobile accordion list.
	 * This keeps indicators and layout aligned with the collapsed nav panel.
	 */
	readonly forceAccordionMode = input<boolean>(false);

	/** Emitted when the item is clicked. */
	readonly clicked = output<{ item: HubNavItem; event: Event }>();

	/** Emitted when the dropdown toggle is activated. */
	readonly toggleDropdown = output<HubNavItem>();

	/** Reference to the nav state service. */
	private readonly state = inject(HubNavStateService);

	/** Whether the desktop icon rail is active on the owning nav. */
	readonly railActive = computed(() => this.state.railActive());

	/** Glyph template declared on the owning nav, if any. Null leaves the icon class in charge. */
	readonly iconTemplate = computed(() => this.state.iconTemplate());

	/** Context handed to the glyph template. */
	readonly iconContext = computed<HubNavItemIconContext>(() => ({
		$implicit: this.item(),
		rail: this.railActive()
	}));

	/**
	 * Tooltip text for the item while the rail hides its label. Empty outside
	 * the rail, which keeps the underlying tooltip controller disabled.
	 */
	readonly railTooltip = computed(() => (this.railActive() ? this.item().label : ''));

	/** Tooltip side: away from the rail, following the configured sidebar side. */
	readonly railTooltipPlacement = computed(() => (this.state.config().sidebarSide === 'right' ? 'left' : 'right'));

	/**
	 * Which `aria-current` token the marked entry announces.
	 *
	 * `page` is a claim about the document that is open, so it is only true when the
	 * route is what marked the item. An entry marked by the host — a section of this
	 * page, a step, a selection — is `location`: the reader is here, but the page did
	 * not change to say so.
	 */
	readonly ariaCurrent = computed<'page' | 'location' | null>(() => {
		if (!this.isActive()) {
			return null;
		}

		return this.state.explicitMark(this.item()) === true ? 'location' : 'page';
	});

	/** Accessible label for the caret button, resolved through the nav labels. */
	readonly caretAriaLabel = computed(() => this.state.toggleSectionLabel(this.item().label));

	/**
	 * First character of the label, rendered as a stand-in glyph while the
	 * rail hides labels and the item declares no icon — an icon-less item
	 * would otherwise collapse into an invisible hit target.
	 */
	readonly railInitial = computed(() => (this.railActive() && !this.item().icon ? this.item().label.charAt(0) : ''));

	/** Whether this item has child items. */
	readonly hasChildren = computed(() => {
		const children = this.item().children;
		return !!children && children.length > 0;
	});

	/** Whether this item is a header type. */
	readonly isHeader = computed(() => this.item().type === 'header');

	/** Whether this item is a link type. */
	readonly isLink = computed(() => this.item().type === 'link');

	/** Whether this item is a dropdown type. */
	readonly isDropdown = computed(() => this.item().type === 'dropdown');

	/** Whether this item is a custom type. */
	readonly isCustom = computed(() => this.item().type === 'custom');

	/** Resolved route for routerLink binding. */
	readonly resolvedRoute = computed(() => {
		const item = this.item();
		if (!item.route) {
			return null;
		}
		return Array.isArray(item.route) ? item.route : [item.route];
	});

	/** Template context for custom item templates. */
	readonly templateContext = computed(() => ({
		$implicit: this.item(),
		active: this.isActive(),
		expanded: this.isExpanded(),
		depth: this.depth(),
		rail: this.railActive()
	}));

	/**
	 * Whether the dropdown caret should be visible for this item.
	 * In panel mode, caret is hidden because expansion happens in side panels.
	 */
	readonly showCaret = computed(() => {
		if (!(this.isDropdown() || this.hasChildren())) {
			return false;
		}

		if (this.forceAccordionMode()) {
			return true;
		}

		// The rail has no room for a split caret: the whole item is the
		// trigger, mirroring panel mode.
		if (this.railActive()) {
			return false;
		}

		return this.state.getEffectiveExpandMode(this.item()) !== 'panel';
	});

	/**
	 * Handles click events on the item.
	 * Delegates to dropdown toggle or emits a click event depending on item type.
	 *
	 * @param event - The original DOM event.
	 */
	onItemClick(event: Event): void {
		const item = this.item();

		if (item.disabled) {
			event.preventDefault();
			return;
		}

		if (item.type === 'header' || item.type === 'separator') {
			event.preventDefault();
			return;
		}

		if (this.hasChildren()) {
			this.toggleDropdown.emit(item);
		}

		this.clicked.emit({ item, event });
	}

	/**
	 * Handles clicks on the label/link area of a routable dropdown item.
	 * In this case the click only performs navigation and does not toggle
	 * the submenu; submenu expansion is delegated to the dedicated caret.
	 *
	 * @param event - The original DOM event.
	 */
	onRouteItemClick(event: Event): void {
		const item = this.item();

		if (item.disabled) {
			event.preventDefault();
			return;
		}

		// In panel mode there is no dedicated caret, so the label click must
		// also request the child panel opening while preserving the route click.
		if (this.hasChildren() && !this.showCaret()) {
			this.toggleDropdown.emit(item);
		}

		this.clicked.emit({ item, event });
	}

	/**
	 * Handles clicks on the dedicated caret button for routable dropdown items.
	 * The caret only toggles submenu visibility and must never trigger routing.
	 *
	 * @param event - The original DOM event.
	 */
	onCaretClick(event: Event): void {
		const item = this.item();

		event.preventDefault();
		event.stopPropagation();

		if (item.disabled || !this.hasChildren()) {
			return;
		}

		this.toggleDropdown.emit(item);
	}
}
