import { HubNavItem } from './nav-item.model';

/**
 * Template context provided to the `hubNavItemTemplate` directive.
 * Allows consumers to customize how individual nav items are rendered.
 */
export interface HubNavItemTemplateContext {
	/** The navigation item being rendered. */
	$implicit: HubNavItem;

	/** Whether the item (or one of its descendants) is currently active. */
	active: boolean;

	/** Whether the item's dropdown is currently expanded (only for `type: 'dropdown'`). */
	expanded: boolean;

	/** Nesting depth level (0 = root level). */
	depth: number;

	/**
	 * Whether the desktop icon rail is active. Distinct from the mobile
	 * `collapsed` state: the rail only exists on vertical desktop navs.
	 */
	rail?: boolean;
}

/**
 * Template context provided to the `hubNavItemIcon` directive.
 */
export interface HubNavItemIconContext {
	/** The navigation item whose glyph is being rendered. Always carries an `icon`. */
	$implicit: HubNavItem;

	/**
	 * Whether the desktop icon rail is active, where the glyph is all the reader sees of the
	 * entry. Lets a projected icon grow, or swap for a denser variant, in that column alone.
	 */
	rail: boolean;
}

/**
 * Template context provided to the `hubNavStart` directive.
 */
export interface HubNavStartTemplateContext {
	/** Whether the navigation menu is currently collapsed (mobile viewport). */
	collapsed: boolean;
	/**
	 * Whether this render is inside the offcanvas mobile drawer (as opposed to
	 * the slim collapsed top bar, which also gets `collapsed: true`). Lets
	 * consumers show a full header in the drawer while keeping the top bar slim.
	 */
	inDrawer?: boolean;
	/**
	 * Whether the desktop icon rail is active. Distinct from `collapsed`
	 * (mobile viewport): the rail is desktop-only, so both flags are never
	 * `true` at the same time. Lets shells swap the full logo for a mark.
	 */
	rail?: boolean;
}

/**
 * Template context provided to the `hubNavEnd` directive.
 */
export interface HubNavEndTemplateContext {
	/** Whether the navigation menu is currently collapsed (mobile viewport). */
	collapsed: boolean;
	/**
	 * Whether this render is inside the offcanvas mobile drawer (as opposed to
	 * the slim collapsed top bar, which also gets `collapsed: true`). Lets
	 * consumers show a full footer in the drawer while keeping the top bar slim.
	 */
	inDrawer?: boolean;
	/**
	 * Whether the desktop icon rail is active. Distinct from `collapsed`
	 * (mobile viewport): the rail is desktop-only, so both flags are never
	 * `true` at the same time. Lets shells collapse footer content.
	 */
	rail?: boolean;
}
