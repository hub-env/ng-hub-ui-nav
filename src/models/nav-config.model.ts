import { HubNavLabels } from './nav-labels.model';

/**
 * Configuration for the `hub-nav` component.
 * All properties are optional — defaults are applied via `HubNavConfigService`.
 */
export interface HubNavConfig {
	/**
	 * Orientation of the navigation menu.
	 * - `horizontal`: Top navigation bar.
	 * - `vertical`: Side navigation bar.
	 * @default 'horizontal'
	 */
	orientation: HubNavOrientation;

	/**
	 * Expansion mode for child items in vertical orientation.
	 * - `accordion`: Children expand/collapse inline with animation.
	 * - `flyout`: Children appear as a positioned side panel.
	 * - `panel`: Children open a stacked drill-down panel beside the nav
	 *   (see `panelMaxVisible` and `panelWidth`).
	 * @default 'accordion'
	 */
	verticalExpandMode: HubNavVerticalExpandMode;

	/**
	 * Trigger mechanism for opening dropdowns.
	 * - `hover`: Open on mouse hover.
	 * - `click`: Open on click.
	 * - `both`: Open on hover or click.
	 * @default 'click'
	 */
	dropdownTrigger: HubNavDropdownTrigger;

	/**
	 * CSS positioning strategy for the nav container.
	 * Sticky positioning is only activated for vertical, non-collapsed navs.
	 * @default 'static'
	 */
	position: HubNavPosition;

	/**
	 * Top offset used when sticky positioning is enabled.
	 * Accepts any valid CSS length value.
	 * @default '0px'
	 */
	stickyTop: string;

	/**
	 * Display mode when the menu collapses on smaller viewports.
	 * - `offcanvas`: Slide-in drawer panel.
	 * - `dropdown`: Panel drops below the toggler.
	 * - `fullscreen`: Full-screen overlay.
	 * @default 'offcanvas'
	 */
	collapseMode: HubNavCollapseMode;

	/**
	 * Viewport width in pixels below which the menu collapses.
	 * Set to `0` to disable responsive collapsing.
	 * @default 992
	 */
	collapseBreakpoint: number;

	/**
	 * Position from which the offcanvas panel slides in.
	 * Only applicable when `collapseMode` is `'offcanvas'`.
	 * @default 'start'
	 */
	offcanvasPosition: HubNavOffcanvasPosition;

	/**
	 * Accessible label for the `<nav>` element.
	 * @default 'Navigation'
	 */
	ariaLabel: string;

	/**
	 * Maximum number of simultaneously visible panels in panel expand mode.
	 * When exceeded, the last panel uses drill-down (replaces its content with back navigation).
	 * Only applies when `verticalExpandMode` is `'panel'` or individual items have `expandMode: 'panel'`.
	 * @default 3
	 */
	panelMaxVisible: number;

	/**
	 * Physical side where the sidebar is placed.
	 * - `left`: Sidebar on the left, panels extend to the right.
	 * - `right`: Sidebar on the right, panels extend to the left.
	 * @default 'left'
	 */
	sidebarSide: HubNavSidebarSide;

	/**
	 * Width of each panel in panel expand mode.
	 * Accepts any valid CSS width value.
	 * @default '16rem'
	 */
	panelWidth: string;

	/**
	 * Rendering strategy for dropdown and flyout menus outside panel mode.
	 * - `inline`: Render submenus inside the nav DOM tree.
	 * - `overlay`: Render submenus in a body-level overlay to avoid clipping.
	 *
	 * Panel drill-down mode is not affected by this option.
	 *
	 * @default 'inline'
	 */
	dropdownRenderMode: HubNavDropdownRenderMode;

	/**
	 * Whether the built-in rail toggle is rendered on the outer edge of the
	 * primary column of a vertical desktop nav. Set to `false` when the app
	 * provides its own toggle (e.g. in the `hubNavStart` slot).
	 * @default true
	 */
	railToggle?: boolean;

	/**
	 * Whether the active mark travels between items instead of appearing and
	 * disappearing in place.
	 *
	 * Off by default, and the reason is not caution: the mark is normally painted by
	 * each item, so turning this on moves it to a single element shared by the list —
	 * the same pixels, drawn by a different node. An application that has restyled
	 * `.hub-nav-item__link--active` would see its rule stop applying, so this is a
	 * change to opt into rather than to receive.
	 *
	 * Travel only means something between siblings, which is where the mark can move
	 * along a shared edge. Crossing into a submenu, a drill-down panel or a collapsed
	 * rail exchanges one list for another, and the mark fades rather than flying
	 * across a gap that does not exist on screen.
	 *
	 * Honours `prefers-reduced-motion`, where it snaps into place.
	 * @default false
	 */
	activeIndicator?: boolean;

	/**
	 * How eagerly the nav follows a URL that was REPLACED rather than pushed.
	 *
	 * A scroll spy names the section under the reader by replacing the URL as they
	 * scroll. Following every one of those marks whatever they are looking at — the
	 * behaviour a documentation site usually wants — but on a long menu it is also a
	 * highlight that steps to a new item two or three times a second while the reader is
	 * doing nothing but read: measured on a thirty-item panel, twenty changes in six
	 * seconds of ordinary scrolling.
	 *
	 * - `true` — follow each report as it arrives. The default, and what every version
	 *   before this one did.
	 * - a **number** — follow only once the reports have been quiet for that many
	 *   milliseconds, so a scroll lands the mark once, where the reader stopped, instead
	 *   of walking it down the menu on the way. Worth more than it looks: the reports
	 *   themselves arrive 300–1500ms apart, so the delay has to clear that to be felt.
	 * - `false` — never follow. The nav marks only where the reader CHOSE to go.
	 *
	 * Deep links are unaffected in every case: arriving at a URL is a navigation like any
	 * other.
	 * @default true
	 */
	followReplacedUrls?: boolean | number;

	/**
	 * Per-instance overrides for the nav's built-in accessible labels.
	 * Labels omitted here resolve from the shared `HUBUI.NAV.*` dictionary
	 * keys and finally from the English defaults.
	 */
	labels?: Partial<HubNavLabels>;
}

/** Orientation of the navigation layout. */
export type HubNavOrientation = 'horizontal' | 'vertical';

/** Expansion mode for vertical child items. */
export type HubNavVerticalExpandMode = 'accordion' | 'flyout' | 'panel';

/** Physical placement side of the sidebar navigation. */
export type HubNavSidebarSide = 'left' | 'right';

/** Trigger mechanism for dropdown menus. */
export type HubNavDropdownTrigger = 'hover' | 'click' | 'both';

/** Rendering strategy for dropdown and flyout menus. */
export type HubNavDropdownRenderMode = 'inline' | 'overlay';

/** CSS positioning strategy. */
export type HubNavPosition = 'static' | 'sticky' | 'fixed';

/** Collapse display mode for responsive viewports. */
export type HubNavCollapseMode = 'offcanvas' | 'dropdown' | 'fullscreen';

/** Offcanvas slide-in direction. */
export type HubNavOffcanvasPosition = 'start' | 'end' | 'top' | 'bottom';
