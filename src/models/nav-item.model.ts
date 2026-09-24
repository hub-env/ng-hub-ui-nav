import { HubNavVerticalExpandMode } from './nav-config.model';

/**
 * Represents a single navigation item in the menu hierarchy.
 * Supports unlimited nesting through the `children` property.
 */
export interface HubNavItem {
	/** Unique identifier for the item. */
	id: string;

	/** Visible text label. */
	label: string;

	/**
	 * Type of navigation item.
	 * - `link`: Navigable item with routerLink.
	 * - `dropdown`: Parent item that opens a submenu with children.
	 * - `header`: Non-clickable section header text.
	 * - `separator`: Visual divider between groups.
	 * - `custom`: Custom content rendered via template directive.
	 */
	type: HubNavItemType;

	/** Icon CSS class or identifier (e.g., `'bi bi-house'`). */
	icon?: string;

	/** Route path for `routerLink`. Can be a string or an array of segments. */
	route?: string | string[];

	/** Query parameters for `routerLink`. */
	queryParams?: Record<string, string>;

	/** URL fragment for `routerLink`. */
	fragment?: string;

	/**
	 * How the active route is matched for this item.
	 *
	 * By default an item is active on its own route **and on anything below it**,
	 * so a detail page keeps its section marked in the rail — `/customers` stays
	 * active at `/customers/42/edit`. Set `exact: true` when only the route
	 * itself should count, which is what a root item (`/`) almost always wants.
	 */
	routerLinkActiveOptions?: { exact: boolean };

	/** Child items for dropdown/nested menus. Supports unlimited depth. */
	children?: HubNavItem[];

	/** Badge text displayed alongside the label (e.g., notification count). */
	badge?: string;

	/** CSS class applied to the badge element. */
	badgeClass?: string;

	/** Whether the item is disabled (visually muted, non-interactive). */
	disabled?: boolean;

	/**
	 * Marks the item active — or forbids it — whatever the router says.
	 *
	 * The route is the right answer while the URL is what moves between sections, and
	 * the wrong one everywhere else: a rail over the sections of a single page, a wizard
	 * step, a list whose selection lives in a store. Those navs were being hand-marked
	 * from outside, by writing the library's own class onto an element found by its text.
	 *
	 * `true` marks the item and `false` keeps it unmarked even on its own route; leaving
	 * it out is what hands the decision back to the URL. For a mark that moves — one
	 * entry at a time, as a scroll spy reports — use `activeItemId` on `<hub-nav>`
	 * instead of rewriting the tree on every change.
	 */
	active?: boolean;

	/** Additional CSS class applied to the item element. */
	cssClass?: string;

	/** Arbitrary consumer data attached to the item. */
	data?: unknown;

	/**
	 * Per-item override for how children are expanded.
	 * If set, overrides the global `verticalExpandMode` for this specific item.
	 * - `accordion`: Children expand inline.
	 * - `flyout`: Children appear as a positioned dropdown.
	 * - `panel`: Children open in a new stacked side panel.
	 */
	expandMode?: HubNavVerticalExpandMode;
}

/** Allowed types for navigation items. */
export type HubNavItemType = 'link' | 'dropdown' | 'header' | 'separator' | 'custom';
