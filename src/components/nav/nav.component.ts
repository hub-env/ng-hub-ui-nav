import {
	Component,
	ChangeDetectionStrategy,
	input,
	model,
	output,
	inject,
	computed,
	contentChild,
	effect,
	signal,
	OnInit,
	OnDestroy,
	ElementRef,
	NgZone,
	TemplateRef,
	untracked
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { resolveHubAccent } from 'ng-hub-ui-utils';
import { HubNavItem } from '../../models/nav-item.model';
import { HubNavConfig } from '../../models/nav-config.model';
import { HubNavPanelEvent } from '../../models/nav-events.model';
import { HubNavItemListComponent } from '../nav-item-list/nav-item-list.component';
import { HubNavConfigService } from '../../services/nav-config.service';
import { HubNavStateService } from '../../services/nav-state.service';
import { HubNavStartDirective } from '../../directives/nav-start.directive';
import { HubNavEndDirective } from '../../directives/nav-end.directive';
import { HubNavItemTemplateDirective } from '../../directives/nav-item-template.directive';
import { HubNavItemIconDirective } from '../../directives/nav-item-icon.directive';
import { HubNavItemIconContext } from '../../models/nav-template-context.model';
import { HubNavTogglerComponent } from '../nav-toggler/nav-toggler.component';
import { HubNavMobilePanelComponent } from '../nav-mobile-panel/nav-mobile-panel.component';
import { HubNavPanelContainerComponent } from '../nav-panel-container/nav-panel-container.component';
import { HubNavRailToggleComponent } from '../nav-rail-toggle/nav-rail-toggle.component';

let hubNavOverlayOwnerCounter = 0;

/**
 * Root navigation component. Renders a horizontal or vertical navigation bar
 * with support for nested dropdowns, responsive collapsing, brand slot, panel
 * drill-down navigation, and custom item templates.
 *
 * @example
 * ```html
 * <hub-nav [items]="menuItems" [config]="{ orientation: 'horizontal' }" />
 * ```
 */
@Component({
	selector: 'hub-nav',
	standalone: true,
	imports: [
		NgTemplateOutlet,
		HubNavItemListComponent,
		HubNavTogglerComponent,
		HubNavMobilePanelComponent,
		HubNavPanelContainerComponent,
		HubNavRailToggleComponent
	],
	providers: [HubNavStateService],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: {
		class: 'hub-nav',
		'[class.hub-nav--horizontal]': 'resolvedOrientation() === "horizontal"',
		'[class.hub-nav--vertical]': 'resolvedOrientation() === "vertical"',
		'[class.hub-nav--collapsed]': 'isCollapsed()',
		'[class.hub-nav--rail]': 'isRailActive()',
		'[class.hub-nav--sticky]': 'isStickyActive()',
		'[class.hub-nav--fixed]': 'resolvedConfig().position === "fixed"',
		'[class.hub-nav--sidebar-left]': 'resolvedConfig().sidebarSide === "left"',
		'[class.hub-nav--sidebar-right]': 'resolvedConfig().sidebarSide === "right"',
		'[class.hub-nav--has-panels]': 'hasPanels()',
		'[attr.data-variant]': 'color() ?? null',
		'[style.--hub-nav-accent]': 'groupAccent()',
		'[style.align-self]': 'resolvedOrientation() === "vertical" ? "stretch" : null',
		'[style.--hub-nav-sticky-top]': 'resolvedConfig().stickyTop',
		'[style.display]': 'resolvedOrientation() === "vertical" ? "flex" : null',
		'[style.flex-direction]': 'resolvedOrientation() === "vertical" ? "column" : null'
	},
	templateUrl: './nav.component.html',
	styleUrl: './nav.component.scss'
})
export class HubNavComponent implements OnInit, OnDestroy {
	/**
	 * Last route path (without query/fragment) used to synchronize panel state.
	 * Prevents unnecessary panel rebuilds on fragment-only navigations, e.g.
	 * scroll-spy updates in documentation pages.
	 */
	private _lastSyncedPath = '';

	/** Navigation items to render. */
	readonly items = input.required<HubNavItem[]>();

	/** Partial configuration overrides (merged with global defaults). */
	readonly config = input<Partial<HubNavConfig>>({});

	/** Additional CSS class for the nav container. */
	readonly navClass = input<string>('');

	/**
	 * Desktop-only icon rail. When `true`, a vertical nav renders at rail
	 * width (`--hub-nav-rail-width`) showing icons only; accordion sections
	 * open as click-triggered overlay flyouts and item labels surface as
	 * tooltips. Ignored below `collapseBreakpoint`, where the offcanvas
	 * behavior always wins, and ignored entirely for horizontal navs.
	 * Two-way bindable: `[(rail)]` reports flips through `railChange` so the
	 * host can persist the preference (the library stores nothing).
	 */
	readonly rail = model<boolean>(false);

	/**
	 * Entry to mark active, named by its `id` or by its `fragment`, when the router is
	 * not what says where the reader is — a rail over the sections of one page, a wizard
	 * step, a selection held in a store.
	 *
	 * Set, it answers for the whole menu: route matching stands down, so the mark cannot
	 * land on two entries at once, and the marked entry announces itself as
	 * `aria-current="location"` rather than `page`. Set it back to `null` to hand the
	 * decision to the URL again. A single entry that is always marked is better said on
	 * the item itself, with `HubNavItem.active`.
	 *
	 * Two-way bindable: `[(activeItemId)]` reports back through `activeItemIdChange`,
	 * which is how `hubNavScrollSpy` drives the mark when it is bound to this nav.
	 */
	readonly activeItemId = model<string | null>(null);

	/** Optional custom template for rendering nav items (via input binding). */
	readonly itemTemplate = input<TemplateRef<unknown> | null>(null);

	/**
	 * Optional template drawn in place of the icon class of every entry that declares an `icon`
	 * (via input binding). The `hubNavItemIcon` directive is the usual way in; this input exists
	 * for a host that already holds the template, mirroring `itemTemplate`.
	 */
	readonly iconTemplate = input<TemplateRef<HubNavItemIconContext> | null>(null);

	/**
	 * When `true`, the component automatically opens the panels matching the
	 * active router URL on initialization and on every subsequent navigation.
	 * Useful for sidebar navigations where the URL should drive the open state.
	 */
	readonly autoOpenFromRoute = input<boolean>(false);

	/**
	 * Semantic accent applied to the hover/active affordances of the nav items.
	 * Named `color` for consistency with the rest of the hub-ui family
	 * (`<hub-button>`, `<hub-badge>`, `<hub-metrics>`, `<hub-milestone>`). Accepts
	 * ANY colour: a semantic/built-in name (`primary` / `success` / `danger` /
	 * `warning` / `info`), a custom registered accent name, a CSS named colour,
	 * or a literal `#hex` / `rgb()` / `oklch()` / `var()`. Bareword names resolve
	 * to the design-system `--hub-sys-color-<name>` token (falling back to the
	 * word itself as a raw colour); literals are passed through unchanged.
	 * Defaults to `primary` when omitted.
	 */
	readonly color = input<'primary' | 'success' | 'danger' | 'warning' | 'info' | (string & {}) | undefined>(undefined);

	/**
	 * Inline accent fed to the nav styles. A bareword (semantic name / registered
	 * accent / CSS named colour) resolves to `var(--hub-sys-color-<name>, <name>)`
	 * — the ds token with the word itself as a raw fallback — while a literal
	 * `#hex` / `rgb()` / `oklch()` / `var()` is passed through untouched. Returns
	 * `null` when no colour is set, keeping the `primary` default.
	 */
	readonly groupAccent = computed(() => resolveHubAccent(this.color()));

	/** Start slot template projected via `hubNavStart` directive. */
	private readonly startDirective = contentChild(HubNavStartDirective);

	/** End slot template projected via `hubNavEnd` directive. */
	private readonly endDirective = contentChild(HubNavEndDirective);

	/** Item template projected via `hubNavItemTemplate` directive. */
	private readonly itemTemplateDirective = contentChild(HubNavItemTemplateDirective);

	/** Icon template projected via `hubNavItemIcon` directive. */
	private readonly iconTemplateDirective = contentChild(HubNavItemIconDirective);

	/** Resolved start slot template (from directive content projection). */
	readonly startTemplate = computed(() => this.startDirective()?.template ?? null);

	/** Resolved end slot template (from directive content projection). */
	readonly endTemplate = computed(() => this.endDirective()?.template ?? null);

	/** Resolved item template: directive takes priority over input. */
	readonly resolvedItemTemplate = computed(() => this.itemTemplateDirective()?.template ?? this.itemTemplate());

	/** Resolved icon template: directive takes priority over input. */
	readonly resolvedIconTemplate = computed(() => this.iconTemplateDirective()?.template ?? this.iconTemplate());

	/** Start slot context. */
	readonly startContext = computed(() => ({
		collapsed: this.state.collapsed(),
		rail: this.state.railActive()
	}));

	/** End slot context. */
	readonly endContext = computed(() => ({
		collapsed: this.state.collapsed(),
		rail: this.state.railActive()
	}));

	/**
	 * Emitted for every entry the reader can press, route or not.
	 *
	 * It used to fire only for an entry that carried a route, which left an in-page rail with no way
	 * to report its own clicks at all. Headers, separators and disabled entries still never emit, and
	 * the item this carries may have no `route`.
	 */
	readonly itemClick = output<HubNavItem>();

	/** Emitted when a dropdown opens. */
	readonly dropdownOpen = output<HubNavItem>();

	/** Emitted when a dropdown closes. */
	readonly dropdownClose = output<HubNavItem>();

	/** Emitted when the mobile panel toggles. */
	readonly mobileToggle = output<boolean>();

	/** Emitted when a panel is opened, drilled-down, or navigated back. */
	readonly panelChange = output<HubNavPanelEvent>();

	/** Global config service. */
	private readonly configService = inject(HubNavConfigService);

	/** Scoped state service (provided per component). */
	readonly state = inject(HubNavStateService);

	/** Host element reference for click-outside detection. */
	private readonly elementRef = inject(ElementRef);

	/** NgZone for running outside-click handler inside Angular. */
	private readonly zone = inject(NgZone);

	/** Angular router for URL-based panel initialization. */
	private readonly router = inject(Router);

	/** Reactive router URL used to synchronize route-driven nav state. */
	private readonly currentUrl = signal(this.router.url);

	/** Marks when route-driven synchronization can start reacting to inputs. */
	private readonly routeSyncReady = signal(false);

	/** Whether component lifecycle initialization has completed. */
	private initialized = false;

	/** Last applied config signature used to prevent reactive no-op loops. */
	private lastAppliedConfigSignature = '';

	/** Last breakpoint-related signature used to avoid redundant listener rebinds. */
	private lastBreakpointSignature = '';

	/** Subscription for router NavigationEnd events. */
	private routerSub?: Subscription;

	/** Media query list for responsive breakpoint detection. */
	private mediaQuery: MediaQueryList | null = null;

	/** Bound handler for media query changes. */
	private mediaQueryHandler = () => this.refreshCollapsedState();

	/** Bound handler for window resize fallback. */
	private resizeHandler = () => this.refreshCollapsedState();

	/** Bound handler for document click events (click-outside). */
	private documentClickHandler: ((event: MouseEvent) => void) | null = null;

	/** Resolved config = global defaults + component overrides. */
	readonly resolvedConfig = computed(() => this.configService.resolve(this.config()));

	/** Shortcut to resolved orientation. */
	readonly resolvedOrientation = computed(() => this.resolvedConfig().orientation);

	/** Whether panels are currently active (panel stack is non-empty). */
	readonly hasPanels = computed(() => this.state.panelCount() > 0);

	/** Unique owner class applied to this nav instance's overlay dropdowns. */
	readonly overlayOwnerClass = `hub-nav-overlay-owner-${++hubNavOverlayOwnerCounter}`;

	/** Orientation class forwarded to overlay-rendered dropdowns. */
	readonly overlayOrientationClass = computed<'hub-nav--horizontal' | 'hub-nav--vertical'>(() =>
		this.resolvedOrientation() === 'horizontal' ? 'hub-nav--horizontal' : 'hub-nav--vertical'
	);

	/**
	 * Dropdown render mode forwarded to item lists. The rail forces overlay
	 * rendering: an inline flyout would be clipped by the narrow rail column,
	 * and body-level overlays deliberately do not inherit the rail styling,
	 * so flyout labels stay visible.
	 */
	readonly dropdownRenderMode = computed(() =>
		this.state.railActive() ? 'overlay' : this.resolvedConfig().dropdownRenderMode
	);

	/** Whether the desktop icon rail is effectively active. */
	readonly isRailActive = computed(() => this.state.railActive());

	/** Mirrors the rail input into the scoped state service. */
	private railSyncEffect = effect(() => {
		this.state.setRail(this.rail());
	});

	/**
	 * Whether the built-in rail toggle renders. Vertical desktop only — the
	 * mobile top bar has its own hamburger — and removable via config for
	 * apps that ship their own toggle.
	 */
	readonly showRailToggle = computed(
		() => (this.resolvedConfig().railToggle ?? true) && this.resolvedOrientation() === 'vertical' && !this.isCollapsed()
	);

	/**
	 * Flips the rail through the built-in toggle. Writing the model is what
	 * emits `railChange`, so app-side persistence keeps working regardless of
	 * which toggle (built-in or app-provided) performed the flip.
	 */
	onRailToggle(): void {
		this.rail.update((value) => !value);
	}

	/** The sidebar side from resolved config. */
	readonly sidebarSide = computed(() => this.resolvedConfig().sidebarSide);

	/** The panel width from resolved config. */
	readonly panelWidth = computed(() => this.resolvedConfig().panelWidth);

	/** Sync config to state service whenever it changes. */
	private configEffect = effect(() => {
		const resolvedConfig = this.resolvedConfig();
		const nextConfigSignature = this.buildConfigSignature(resolvedConfig);
		const nextBreakpointSignature = this.buildBreakpointSignature(resolvedConfig);

		if (nextConfigSignature !== this.lastAppliedConfigSignature) {
			this.lastAppliedConfigSignature = nextConfigSignature;
			this.state.setConfig(resolvedConfig);
		}

		if (this.initialized && nextBreakpointSignature !== this.lastBreakpointSignature) {
			this.lastBreakpointSignature = nextBreakpointSignature;
			this.teardownBreakpointListener();
			this.setupBreakpointListener();
		}
	});

	/**
	 * Keeps the open drill-down panels reading from the `items` input.
	 *
	 * A panel is opened with the children its entry had at that moment, so a consumer that hands
	 * the nav a new menu — one that finished loading, a section that grew an entry — left the
	 * open panel showing the old one. The route-driven path already re-read them, but only on
	 * the next navigation and only when `autoOpenFromRoute` is on, which leaves every nav driven
	 * by clicks alone with a panel that never changes.
	 *
	 * `untracked` for the same reason as {@link routeSyncEffect}: what this reacts to is the
	 * menu, and the body reads and writes the panel stack.
	 */
	private itemsSyncEffect = effect(() => {
		const items = this.items();

		untracked(() => this.state.syncPanelsWithItems(items));
	});

	/**
	 * Keeps dropdowns and drill-down panels synchronized with the current URL and item tree.
	 *
	 * Everything after the dependency reads runs `untracked`, because the body both reads panel
	 * state and writes it. What this effect should react to is the route and the menu, and
	 * those are the two signals read above the fence; taking a dependency on the state it is
	 * about to rewrite is how an effect becomes its own trigger.
	 *
	 * Defensive rather than a proven fix: a render of this component was observed making ~1.8M
	 * `closeAllPanels` calls in a single SSR pass, but the fence alone does not reproduce or
	 * resolve that in a test — the churn source was not pinned down. Kept because an effect
	 * that reads and writes the same state is a latent loop regardless.
	 */
	private routeSyncEffect = effect(() => {
		if (!this.routeSyncReady() || !this.autoOpenFromRoute()) {
			return;
		}

		const items = this.items();
		const currentUrl = this.currentUrl();

		untracked(() => this.syncFromRoute(items, currentUrl));
	});

	/**
	 * Applies the route to the dropdown and panel state. Split out of {@link routeSyncEffect} so
	 * the reactive dependencies stay visible at the call site and the body can read and write
	 * state freely.
	 *
	 * @param items - Current menu tree.
	 * @param currentUrl - Router URL, fragment included.
	 */
	private syncFromRoute(items: HubNavItem[], currentUrl: string): void {
		const currentPath = this.extractPath(currentUrl);

		if (items.length === 0) {
			this.state.closeAllDropdowns();
			this.state.closeAllPanels();
			this._lastSyncedPath = '';
			return;
		}

		if (this.isCollapsed()) {
			this.state.syncDropdownsWithRoute(items, currentUrl);
			this._lastSyncedPath = currentPath;
			return;
		}

		// Which root the reader is now inside, resolved by the most specific match rather than
		// the first one — the same rule {@link openPanelsFromRoute} uses. A root parked on the
		// language prefix (`/en/`) matches every URL in the site, and taking it as the answer
		// handed an accordion section's navigation to the panel stack.
		const activeRootItem = items.find((item) => this.state.isItemActiveAmongSiblings(item, items, currentUrl));

		// Nowhere in the menu — a settings screen, a 404. Whatever is open describes the page
		// just left, so both mechanisms are cleared rather than only the panels.
		if (!activeRootItem) {
			this.state.closeAllDropdowns();
			this.state.closeAllPanels();
			this._lastSyncedPath = currentPath;
			return;
		}

		// An accordion opens in place, so what the route has to open is its
		// dropdown state — not the panel stack, which is the drill-down mechanism
		// and is not rendered in this mode. Deciding by collapsed-or-not alone
		// left an expanded accordion with nothing opened from the route: the
		// section somebody had just navigated into stayed shut, while a panel
		// nobody could see was opened behind the page.
		if (this.state.getEffectiveExpandMode(activeRootItem) === 'accordion') {
			this.state.syncDropdownsWithRoute(items, currentUrl);
			// In a mixed nav the reader can arrive here from a root that drills down into
			// panels, and that panel now has no owner: an accordion expands in place and
			// never touches the stack, so nothing else would ever close it. Two sections
			// stayed open at once, one of them the one just walked out of.
			this.state.closeAllPanels();
			this._lastSyncedPath = currentPath;
			return;
		}

		// The mirror of the branch above. This root does not expand in place, so any dropdown
		// still open belongs to the section left behind — including the case of a root with no
		// children at all, which opens neither mechanism and must therefore leave neither.
		this.state.closeAllDropdowns();

		if (currentPath === this._lastSyncedPath && this.state.panelCount() > 0) {
			return;
		}

		this.openPanelsFromRoute(currentUrl);
	}

	/** ARIA label for the nav element. */
	readonly ariaLabel = computed(() => this.resolvedConfig().ariaLabel);

	/** Whether the viewport is below the collapse breakpoint. */
	readonly isCollapsed = computed(() => this.state.collapsed());

	/** Whether the mobile panel is open. */
	readonly isMobileOpen = computed(() => this.state.mobileOpen());

	/** Collapse mode from resolved config. */
	readonly collapseMode = computed(() => this.resolvedConfig().collapseMode);

	/** Offcanvas position from resolved config. */
	readonly offcanvasPosition = computed(() => this.resolvedConfig().offcanvasPosition);

	/**
	 * Whether sticky positioning should be activated for the current layout.
	 * Sticky mode is restricted to vertical navigation and also applies while
	 * the nav is collapsed on mobile so the toggler row stays pinned.
	 */
	readonly isStickyActive = computed(
		() => this.resolvedConfig().position === 'sticky' && this.resolvedOrientation() === 'vertical'
	);

	constructor() {
		// Bound, not mirrored. Copying the value into the state service inside an effect lands
		// a change-detection pass behind it, so the first render after the mark moves still
		// paints the entry it moved off — for a scroll spy, that is every mark it reports.
		this.state.bindActiveItemId(this.activeItemId);
		this.state.bindIconTemplate(this.resolvedIconTemplate);
	}

	/** @inheritDoc */
	ngOnInit(): void {
		this.initialized = true;

		// Ensure state receives the final resolved input config before any
		// route-driven panel preloading runs.
		const resolvedConfig = this.resolvedConfig();
		this.lastAppliedConfigSignature = this.buildConfigSignature(resolvedConfig);
		this.lastBreakpointSignature = this.buildBreakpointSignature(resolvedConfig);
		this.state.setConfig(resolvedConfig);

		this.setupBreakpointListener();
		this.setupClickOutsideListener();

		this.routerSub = this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe((e) => {
			this.currentUrl.set((e as NavigationEnd).urlAfterRedirects);
		});

		// Re-read the URL now that the subscription exists. The signal was seeded at
		// construction, when the router had not resolved the first navigation yet, and the
		// NavigationEnd that resolved it fired before the line above could hear it — so the
		// seed stayed at whatever the router reported then, usually '/'. Nothing failed
		// loudly: every route-driven lookup simply matched no item, and a sidebar that
		// should have opened on the section you landed in stayed shut on every load.
		//
		// Set before `routeSyncReady`, so the effect's first real pass already sees the
		// route the page was opened at instead of syncing against a stale one first.
		this.currentUrl.set(this.router.url);
		this.routeSyncReady.set(true);
	}

	/** @inheritDoc */
	ngOnDestroy(): void {
		this.initialized = false;
		this.teardownBreakpointListener();
		this.teardownClickOutsideListener();
		this.routerSub?.unsubscribe();
	}

	/**
	 * Handles item click events bubbled up from the item list.
	 *
	 * @param payload - The clicked item and original DOM event.
	 */
	onItemClick(payload: { item: HubNavItem; event: Event }): void {
		// Every entry the reader can press, route or no route. Gating this on `route` meant
		// an in-page rail — sections of one document, a wizard step, anything the URL does
		// not move between — reported nothing at all, and the applications that needed those
		// clicks went around the component: a listener of their own on the rendered buttons,
		// matching entries by the text inside them.
		this.itemClick.emit(payload.item);

		// Keep parent sections open when the clicked item also owns children.
		// This is required for responsive/mobile accordion behavior and for
		// route-aware items that intentionally perform both actions.
		if (!payload.item.children?.length && !this.routeDrivesAnAccordion(payload.item)) {
			this.state.closeAllDropdowns();
		}
	}

	/**
	 * Whether the route — and not this click — owns the open state around an item.
	 *
	 * A flyout is transient: clicking an entry is what dismisses it, so closing
	 * every dropdown is right. An accordion opened from the route is the opposite;
	 * its open section is a statement about where you are. Closing it on click and
	 * letting the route reopen it a tick later is a section that blinks shut and
	 * open again on every navigation, so the route is left to settle it alone.
	 *
	 * @param item - The item that was clicked.
	 * @returns `true` when the click must not touch the dropdown state.
	 */
	private routeDrivesAnAccordion(item: HubNavItem): boolean {
		return this.autoOpenFromRoute() && this.state.getEffectiveExpandMode(item) === 'accordion';
	}

	/**
	 * Toggles the mobile panel and emits the state change.
	 */
	onMobileToggle(): void {
		this.state.toggleMobile();
		if (this.state.mobileOpen() && this.autoOpenFromRoute()) {
			this.state.syncDropdownsWithRoute(this.items(), this.router.url);
		}
		this.mobileToggle.emit(this.state.mobileOpen());
	}

	/**
	 * Closes the mobile panel.
	 */
	onMobilePanelClose(): void {
		this.state.setMobileOpen(false);
		this.mobileToggle.emit(false);
	}

	/**
	 * Handles dropdown toggle events bubbled up from the item list.
	 * The toggle has already been performed in the item-list; this just
	 * emits the appropriate output event.
	 *
	 * @param item - The dropdown item that was toggled.
	 */
	onDropdownToggle(item: HubNavItem): void {
		if (this.state.isDropdownOpen(item.id)) {
			this.dropdownOpen.emit(item);
		} else {
			this.dropdownClose.emit(item);
		}
	}

	// ──────────────────────────────────────────────
	// Panel event handlers
	// ──────────────────────────────────────────────

	/**
	 * Opens a new panel for the given item's children, or drills down if max panels reached.
	 * Focuses the first item in the newly opened/drilled panel.
	 *
	 * @param item - The item whose children should be displayed in a panel.
	 */
	onPanelOpen(item: HubNavItem): void {
		const stackBefore = this.state.panelStack().length;
		this.state.openPanel(item, this.items());
		const stackAfter = this.state.panelStack().length;

		const panelIndex = stackAfter - 1;
		const action = stackAfter > stackBefore ? 'open' : 'drill-down';
		this.panelChange.emit({ item, panelIndex, action });

		// Focus the first item in the new/updated panel
		this.focusPanelFirstItem(panelIndex);
	}

	/**
	 * Closes a panel and all panels opened after it.
	 * Returns focus to the previous panel or the main nav trigger.
	 *
	 * @param panelId - ID of the panel to close.
	 */
	onPanelClose(panelId: string): void {
		const panel = this.state.getPanelById(panelId);
		if (panel) {
			const panelIndex = this.state.panelStack().indexOf(panel);
			this.state.closePanel(panelId);
			this.panelChange.emit({ item: panel.parentItem, panelIndex, action: 'close' });

			// Return focus to previous panel or the main nav
			this.returnFocusAfterPanelClose(panelIndex, panel.parentItem.id);
		}
	}

	/**
	 * Navigates back within a panel's drill-down history.
	 * Focuses the first item after navigating back.
	 *
	 * @param panelId - ID of the panel to navigate back in.
	 */
	onPanelBack(panelId: string): void {
		const panel = this.state.getPanelById(panelId);
		if (panel) {
			const panelIndex = this.state.panelStack().indexOf(panel);
			this.state.navigateBackInPanel(panelId);
			this.panelChange.emit({ item: panel.parentItem, panelIndex, action: 'drill-back' });

			// Focus the first item in the panel after navigating back
			this.focusPanelFirstItem(panelIndex);
		}
	}

	/**
	 * Focuses the first focusable item inside a panel at the given index.
	 *
	 * @param panelIndex - Zero-based index of the panel in the DOM.
	 */
	private focusPanelFirstItem(panelIndex: number): void {
		requestAnimationFrame(() => {
			const panels = this.elementRef.nativeElement.querySelectorAll('hub-nav-panel');
			const targetPanel = panels[panelIndex] as HTMLElement | undefined;
			if (targetPanel) {
				const firstItem = targetPanel.querySelector(
					'.hub-nav-item__link, .hub-nav-item__dropdown-toggle'
				) as HTMLElement | null;
				firstItem?.focus();
			}
		});
	}

	/**
	 * Returns focus to the appropriate element after a panel is closed.
	 * If a previous panel exists, focuses its trigger for the closed item.
	 * Otherwise, returns focus to the main nav item-list.
	 *
	 * @param closedIndex - The index of the panel that was closed.
	 * @param parentItemId - The ID of the parent item that triggered the closed panel.
	 */
	private returnFocusAfterPanelClose(closedIndex: number, parentItemId: string): void {
		requestAnimationFrame(() => {
			if (closedIndex > 0) {
				// Focus the trigger in the previous panel
				const panels = this.elementRef.nativeElement.querySelectorAll('hub-nav-panel');
				const prevPanel = panels[closedIndex - 1] as HTMLElement | undefined;
				if (prevPanel) {
					const trigger = prevPanel.querySelector(
						`hub-nav-item[data-item-id="${parentItemId}"] .hub-nav-item__link,` +
							`hub-nav-item[data-item-id="${parentItemId}"] .hub-nav-item__dropdown-toggle`
					) as HTMLElement | null;
					trigger?.focus();
					return;
				}
			}
			// Fallback: focus the trigger in the main nav
			const mainTrigger = this.elementRef.nativeElement.querySelector(
				`hub-nav-item[data-item-id="${parentItemId}"] .hub-nav-item__link,` +
					`hub-nav-item[data-item-id="${parentItemId}"] .hub-nav-item__dropdown-toggle`
			) as HTMLElement | null;
			mainTrigger?.focus();
		});
	}

	/**
	 * Sets up a `matchMedia` listener for the configured collapse breakpoint.
	 */
	private setupBreakpointListener(): void {
		const bp = this.resolvedConfig().collapseBreakpoint;
		if (bp <= 0 || typeof window === 'undefined') {
			this.state.setCollapsed(false);
			return;
		}

		this.mediaQuery = window.matchMedia(`(max-width: ${bp - 1}px)`);
		this.refreshCollapsedState();
		this.mediaQuery.addEventListener('change', this.mediaQueryHandler);
		window.addEventListener('resize', this.resizeHandler, { passive: true });
	}

	/** Tears down the `matchMedia` listener. */
	private teardownBreakpointListener(): void {
		if (this.mediaQuery) {
			this.mediaQuery.removeEventListener('change', this.mediaQueryHandler);
			this.mediaQuery = null;
		}

		if (typeof window !== 'undefined') {
			window.removeEventListener('resize', this.resizeHandler);
		}
	}

	/**
	 * Registers a document click listener that closes dropdowns on outside clicks.
	 * Panel drill-down mode panels are NOT closed by outside clicks.
	 */
	private setupClickOutsideListener(): void {
		if (typeof document === 'undefined') {
			return;
		}

		this.documentClickHandler = (event: MouseEvent) => {
			const target = event.target as HTMLElement;
			const clickInsideHost = this.elementRef.nativeElement.contains(target);
			const clickInsideOverlay = !!target.closest(`.${this.overlayOwnerClass}`);
			if (!clickInsideHost && !clickInsideOverlay) {
				this.zone.run(() => {
					// Close dropdowns/flyouts on outside click
					this.state.closeAllDropdowns();
					// DO NOT close panels — they should only close via explicit user action (back/close buttons)
				});
			}
		};

		document.addEventListener('click', this.documentClickHandler);
	}

	/** Removes the document click listener. */
	private teardownClickOutsideListener(): void {
		if (this.documentClickHandler) {
			document.removeEventListener('click', this.documentClickHandler);
			this.documentClickHandler = null;
		}
	}

	/**
	 * Callback invoked when the viewport crosses the collapse breakpoint.
	 *
	 * @param belowBreakpoint - `true` if the viewport is now below the breakpoint.
	 */
	private onBreakpointChange(belowBreakpoint: boolean): void {
		if (belowBreakpoint === this.isCollapsed()) {
			return;
		}
		this.state.setCollapsed(belowBreakpoint);
		if (!belowBreakpoint) {
			this.state.closeAllDropdowns();
			this.mobileToggle.emit(false);
			this.restorePanelsAfterExpand();
		}
	}

	/**
	 * Rebuilds the panel stack when the viewport comes back above the breakpoint.
	 *
	 * Crossing back up used to empty the stack, and nothing refilled it: panels are derived from
	 * the route only on navigation, so a sidebar that had been narrowed to mobile came back
	 * expanded but with no section panel until the user navigated somewhere else. Host apps key
	 * their own layout off that panel — hiding their in-page section index while the nav shows
	 * one — so its absence unfolds a full-height menu over the page the user was reading.
	 *
	 * Rebuilding rather than simply not clearing, because the stack can be stale: while collapsed
	 * the offcanvas menu navigates without touching the panels (they are not rendered in that
	 * mode), so a surviving stack would describe the page the user left. Deriving it again from
	 * the current URL is the only answer that holds whether or not the route moved meanwhile.
	 *
	 * Only when the route owns the panels. Without `autoOpenFromRoute` the stack is whatever the
	 * user opened by hand and nothing can re-derive it, so it is left untouched — which is also
	 * what makes the narrow/widen round trip end exactly where it started.
	 */
	private restorePanelsAfterExpand(): void {
		if (!this.autoOpenFromRoute()) {
			return;
		}

		// Forget the last synced path first: its guard would otherwise read a stack built for
		// another URL as one already in sync with this one, and skip the rebuild.
		this._lastSyncedPath = '';
		this.syncFromRoute(this.items(), this.currentUrl());
	}

	/**
	 * Recomputes the collapsed state from the current viewport width.
	 * This complements `matchMedia` events, which can become unreliable in
	 * some browser/devtools combinations when the viewport is resized or
	 * docked without emitting the expected media-query change sequence.
	 */
	private refreshCollapsedState(): void {
		if (typeof window === 'undefined') {
			return;
		}

		const bp = this.resolvedConfig().collapseBreakpoint;
		if (bp <= 0) {
			this.onBreakpointChange(false);
			return;
		}

		this.onBreakpointChange(window.innerWidth < bp);
	}

	/**
	 * Parses the given URL and opens the panels that correspond to the active route.
	 *
	 * The algorithm:
	 * 1. Extract the path without fragment/query.
	 * 2. Find the root item whose own route or descendants match the active URL.
	 * 3. Open a panel for that root item (closes any existing panels first).
	 * 4. If a child section with nested items also matches the active URL
	 *    (e.g. the "Examples" dropdown), open a second panel for it.
	 *
	 * This matching strategy is resilient to localized prefixes such as
	 * `/en/modal/overview` and `/es/modal/examples#modal-basic`.
	 *
	 * @param url - The full URL including optional fragment.
	 */
	private openPanelsFromRoute(url: string): void {
		const path = this.extractPath(url);

		const rootItems = this.items();
		if (rootItems.length === 0) {
			return;
		}

		const rootItem = rootItems.find((item) => this.state.isItemActiveAmongSiblings(item, rootItems, url));
		if (!rootItem?.children?.length) {
			this.state.closeAllPanels();
			this._lastSyncedPath = path;
			return;
		}

		this._lastSyncedPath = path;

		const sectionItem = rootItem.children.find(
			(child) => child.children?.length && this.state.isItemOrDescendantActive(child, url)
		);

		// Moving between entries of the panels already open keeps them. Rebuilding gave each
		// panel a new id, the container tracks panels by id, and so every click inside a
		// panel mounted it again: its entrance animation replayed and its items jumped. The
		// contents are re-read in place, so a changed list of items still shows.
		const wanted = sectionItem ? [rootItem, sectionItem] : [rootItem];
		if (this.state.holdsPanelChain(wanted)) {
			this.state.refreshPanelItems(wanted);
			return;
		}

		// Anything else rebuilds from scratch, which also covers a visibility limit or an
		// orientation that changed since the panels were opened.
		this.state.closeAllPanels();
		this.state.openPanel(rootItem, rootItems);

		if (sectionItem) {
			// Keep root-level replacement logic scoped to true root items.
			// Passing rootItems here preserves drill-down behavior when
			// `panelMaxVisible` forces nested levels to replace the last panel.
			this.state.openPanel(sectionItem, rootItems);
		}
	}

	/**
	 * Extracts the path part from a URL-like string, removing query and fragment.
	 *
	 * @param url - Router URL.
	 * @returns Normalized path for route-state comparisons.
	 */
	private extractPath(url: string): string {
		return url.split('?')[0].split('#')[0];
	}

	/**
	 * Builds a stable signature for the effective nav config so repeated
	 * reactivity passes with identical values do not trigger work.
	 *
	 * @param config - Effective nav config.
	 * @returns Stable string signature.
	 */
	private buildConfigSignature(config: HubNavConfig): string {
		return JSON.stringify({
			orientation: config.orientation,
			verticalExpandMode: config.verticalExpandMode,
			dropdownTrigger: config.dropdownTrigger,
			position: config.position,
			stickyTop: config.stickyTop,
			collapseMode: config.collapseMode,
			collapseBreakpoint: config.collapseBreakpoint,
			offcanvasPosition: config.offcanvasPosition,
			ariaLabel: config.ariaLabel,
			panelMaxVisible: config.panelMaxVisible,
			sidebarSide: config.sidebarSide,
			panelWidth: config.panelWidth,
			labels: config.labels ?? null
		});
	}

	/**
	 * Builds a stable signature for breakpoint listener inputs.
	 *
	 * @param config - Effective nav config.
	 * @returns Stable breakpoint signature.
	 */
	private buildBreakpointSignature(config: HubNavConfig): string {
		return JSON.stringify({
			collapseBreakpoint: config.collapseBreakpoint,
			orientation: config.orientation
		});
	}
}
