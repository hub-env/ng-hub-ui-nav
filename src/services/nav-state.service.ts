import { Injectable, signal, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { HubTranslationService } from 'ng-hub-ui-utils';
import { HubNavItem } from '../models/nav-item.model';
import { HubNavConfig, HubNavVerticalExpandMode } from '../models/nav-config.model';
import { HubNavPanelState } from '../models/nav-panel-state.model';
import { HUB_NAV_DEFAULT_LABELS, HUB_NAV_LABEL_KEYS, HubNavLabels } from '../models/nav-labels.model';

/**
 * Internal state management service for a single `hub-nav` instance.
 * Scoped per component — provided at the component level, not root.
 *
 * Manages:
 * - Resolved configuration.
 * - Open dropdown tracking.
 * - Mobile menu state.
 * - Active route propagation.
 * - Panel stack for drill-down navigation.
 */
@Injectable()
export class HubNavStateService {
	/** Currently resolved configuration. */
	private _config = signal<HubNavConfig>({
		orientation: 'horizontal',
		verticalExpandMode: 'accordion',
		dropdownTrigger: 'click',
		position: 'static',
		stickyTop: '0px',
		collapseMode: 'offcanvas',
		collapseBreakpoint: 992,
		offcanvasPosition: 'start',
		ariaLabel: 'Navigation',
		panelMaxVisible: 3,
		sidebarSide: 'left',
		panelWidth: '16rem',
		dropdownRenderMode: 'inline',
		railToggle: true
	});

	/** Set of dropdown item IDs that are currently open. */
	private _openDropdowns = signal<Set<string>>(new Set());

	/** Whether the mobile panel is open. */
	private _mobileOpen = signal(false);

	/** Whether the viewport is below the collapse breakpoint. */
	private _collapsed = signal(false);

	/** Whether the desktop icon rail is requested by the host. */
	private _rail = signal(false);

	/**
	 * Optional bridge to the shared Hub UI dictionary. Absent when the app
	 * does not register `provideHubTranslationAdapter()`.
	 */
	private readonly translationSvc = inject(HubTranslationService, { optional: true });

	/**
	 * Re-evaluates the label resolution whenever the external dictionary emits
	 * a new language. The emitted value itself is unused; reading the signal
	 * inside `labels` is what creates the dependency.
	 */
	private readonly translationSnapshot = this.translationSvc
		? toSignal(this.translationSvc.translationObserver, { initialValue: null })
		: signal(null).asReadonly();

	/** Stack of open panels for panel expand mode. */
	private _panelStack = signal<HubNavPanelState[]>([]);

	/** Auto-incrementing counter for unique panel IDs. */
	private _panelIdCounter = 0;

	/** Readonly config signal. */
	readonly config = this._config.asReadonly();

	/** Readonly mobile-open signal. */
	readonly mobileOpen = this._mobileOpen.asReadonly();

	/** Readonly collapsed signal. */
	readonly collapsed = this._collapsed.asReadonly();

	/** Readonly rail request signal (the raw host input, before gating). */
	readonly rail = this._rail.asReadonly();

	/**
	 * Whether the icon rail is effectively active. The rail is desktop-only
	 * and vertical-only: below the collapse breakpoint the offcanvas behavior
	 * always wins, and a horizontal nav has no rail at all.
	 */
	readonly railActive = computed(() => this._rail() && !this._collapsed() && this._config().orientation === 'vertical');

	/**
	 * Accessible labels for the nav's built-in controls. Per label the
	 * resolution order is: instance override (`config.labels`), shared
	 * `HUBUI.NAV.*` dictionary key, English fallback.
	 */
	readonly labels = computed<HubNavLabels>(() => {
		this.translationSnapshot();
		const overrides = this._config().labels ?? {};
		const resolved = {} as HubNavLabels;
		(Object.keys(HUB_NAV_DEFAULT_LABELS) as Array<keyof HubNavLabels>).forEach((name) => {
			resolved[name] = overrides[name] ?? this.translate(HUB_NAV_LABEL_KEYS[name]) ?? HUB_NAV_DEFAULT_LABELS[name];
		});
		return resolved;
	});

	/** Readonly panel stack signal. */
	readonly panelStack = this._panelStack.asReadonly();

	/** Number of currently open panels. */
	readonly panelCount = computed(() => this._panelStack().length);

	/** Computed orientation shortcut. */
	readonly orientation = computed(() => this._config().orientation);

	/** Whether the active mark is a single travelling element rather than one per item. */
	readonly activeIndicator = computed(() => this._config().activeIndicator ?? false);

	/** How a replaced URL — what a scroll spy writes — reaches the active mark. */
	readonly followReplacedUrls = computed(() => this._config().followReplacedUrls ?? true);

	/** Quiet period a stream of position reports must clear, or 0 to follow each one. */
	readonly replacedUrlSettleMs = computed(() => {
		const follow = this.followReplacedUrls();

		return typeof follow === 'number' ? Math.max(0, follow) : 0;
	});

	/** Computed vertical expand mode shortcut. */
	readonly verticalExpandMode = computed(() => this._config().verticalExpandMode);

	/**
	 * Computed dropdown trigger shortcut. The rail forces the click trigger:
	 * hover-triggered overlay flyouts need pointer hand-off between separate
	 * DOM trees and are explicitly out of the rail's scope.
	 */
	readonly dropdownTrigger = computed(() => (this.railActive() ? 'click' : this._config().dropdownTrigger));

	/**
	 * Builds the section-toggle label for an item, replacing the `{label}`
	 * placeholder with the item's own label.
	 *
	 * @param itemLabel - Visible label of the section item.
	 * @returns Resolved accessible label for the caret/toggle control.
	 */
	toggleSectionLabel(itemLabel: string): string {
		return this.labels().toggleSection.replace('{label}', itemLabel);
	}

	/**
	 * Reads a translation from the shared dictionary, normalizing empty and
	 * non-string results to `undefined` so callers can chain fallbacks.
	 *
	 * @param key - Dot-separated dictionary key.
	 * @returns The translated string, or `undefined` when unavailable.
	 */
	private translate(key: string): string | undefined {
		const value = this.translationSvc?.getTranslation(key);
		return typeof value === 'string' && value.length > 0 ? value : undefined;
	}

	/**
	 * Sets the desktop rail request from the host component. Flipping the
	 * state closes every open dropdown: an inline accordion expanded before
	 * the switch would otherwise reappear as an unexpected open flyout.
	 *
	 * @param rail - Whether the icon rail is requested.
	 */
	setRail(rail: boolean): void {
		if (this._rail() === rail) {
			return;
		}
		this._rail.set(rail);
		this.closeAllDropdowns();
	}

	/**
	 * Updates the resolved configuration.
	 *
	 * @param config - Full resolved configuration.
	 */
	setConfig(config: HubNavConfig): void {
		this._config.set(config);
		this.reconcilePanelStackWithConfig(config);
	}

	/**
	 * Normalizes the panel stack after config changes.
	 *
	 * This is required when `panelMaxVisible` changes after panels were already
	 * opened (for example during initial input binding in the host app shell).
	 * Without this reconciliation, the UI can temporarily render more panels
	 * than allowed or keep a last panel without header while its parent panel
	 * is no longer visible.
	 *
	 * @param config - The latest resolved configuration.
	 */
	private reconcilePanelStackWithConfig(config: HubNavConfig): void {
		const effectiveMaxVisible = Math.max(1, config.panelMaxVisible - 1);
		const current = this._panelStack();

		if (current.length <= effectiveMaxVisible) {
			return;
		}

		const hiddenPanelsCount = current.length - effectiveMaxVisible;
		const trimmed = current.slice(-effectiveMaxVisible).map((panel, index) => {
			// If some parent panels were trimmed, the first visible panel must
			// render a header because its parent context is now hidden.
			if (hiddenPanelsCount > 0 && index === 0 && !panel.isDrillDown) {
				return {
					...panel,
					isDrillDown: true
				};
			}
			return panel;
		});

		this._panelStack.set(trimmed);
	}

	// ──────────────────────────────────────────────
	// Dropdown management
	// ──────────────────────────────────────────────

	/**
	 * Checks whether a dropdown with the given item ID is open.
	 *
	 * @param id - Item ID to check.
	 * @returns `true` if the dropdown is open.
	 */
	isDropdownOpen(id: string): boolean {
		return this._openDropdowns().has(id);
	}

	/**
	 * Opens a dropdown by item ID.
	 * In accordion mode, closes sibling dropdowns at the same level.
	 *
	 * @param id - Item ID to open.
	 * @param siblings - Optional array of sibling item IDs to close when opening this one.
	 */
	openDropdown(id: string, siblings?: string[]): void {
		this._openDropdowns.update((set) => {
			const next = new Set(set);

			// In accordion mode, close sibling dropdowns
			if (siblings && this._config().verticalExpandMode === 'accordion') {
				siblings.forEach((siblingId) => {
					if (siblingId !== id) {
						next.delete(siblingId);
					}
				});
			}

			next.add(id);
			return next;
		});
	}

	/**
	 * Closes a dropdown by item ID.
	 *
	 * @param id - Item ID to close.
	 */
	closeDropdown(id: string): void {
		this._openDropdowns.update((set) => {
			const next = new Set(set);
			next.delete(id);
			return next;
		});
	}

	/**
	 * Toggles a dropdown open/closed by item ID.
	 *
	 * @param id - Item ID to toggle.
	 * @returns `true` if the dropdown is now open.
	 */
	toggleDropdown(id: string): boolean {
		if (this.isDropdownOpen(id)) {
			this.closeDropdown(id);
			return false;
		}
		this.openDropdown(id);
		return true;
	}

	/** Closes all open dropdowns. */
	closeAllDropdowns(): void {
		this._openDropdowns.set(new Set());
	}

	/**
	 * Synchronizes the open dropdown set with the current active route.
	 * Only ancestor items in the active trail remain open.
	 *
	 * @param items - Root navigation items to inspect.
	 * @param activeRoute - Current router URL including optional fragment.
	 */
	syncDropdownsWithRoute(items: HubNavItem[], activeRoute: string): void {
		const nextOpenIds = new Set(this.findActiveDropdownTrail(items, activeRoute));
		this._openDropdowns.set(nextOpenIds);
	}

	// ──────────────────────────────────────────────
	// Mobile state
	// ──────────────────────────────────────────────

	/**
	 * Sets the mobile panel open state.
	 *
	 * @param open - Whether the mobile panel should be open.
	 */
	setMobileOpen(open: boolean): void {
		this._mobileOpen.set(open);
	}

	/** Toggles the mobile panel. */
	toggleMobile(): void {
		this._mobileOpen.update((v) => !v);
	}

	/**
	 * Sets the collapsed state (below breakpoint).
	 *
	 * @param collapsed - Whether the viewport is below the collapse breakpoint.
	 */
	setCollapsed(collapsed: boolean): void {
		if (this._collapsed() === collapsed) {
			return;
		}
		this._collapsed.set(collapsed);
		if (!collapsed) {
			this._mobileOpen.set(false);
		}
	}

	// ──────────────────────────────────────────────
	// Panel stack management
	// ──────────────────────────────────────────────

	/**
	 * Opens a new panel for the given parent item's children.
	 * If the panel count has reached `panelMaxVisible`, drills down within the last panel instead.
	 *
	 * @param parentItem - The item whose children should be displayed in the panel.
	 * @param rootItems - The root-level navigation items (to determine if parentItem is at root level).
	 */
	openPanel(parentItem: HubNavItem, rootItems?: HubNavItem[]): void {
		if (!parentItem.children || parentItem.children.length === 0) {
			return;
		}

		const maxVisible = this._config().panelMaxVisible;
		const currentStack = this._panelStack();

		// Check if this exact item already has a panel open
		const existingIndex = currentStack.findIndex((p) => p.parentItem.id === parentItem.id);
		if (existingIndex >= 0) {
			// Panel for this item already exists — close it and all after it
			this.closePanelsFromIndex(existingIndex);
			return;
		}

		// If parentItem is a root-level item and there are already panels open,
		// close all existing panels before opening the new one (same-level replacement)
		const isRootLevel = rootItems?.some((item) => item.id === parentItem.id);
		if (isRootLevel && currentStack.length > 0) {
			this.closeAllPanels();
		}

		// Determine the depth of the new panel
		const newPanelDepth = this.findPanelDepth(parentItem, currentStack);

		// Close panels at the same depth or deeper (sibling replacement)
		if (newPanelDepth >= 0) {
			// Close all panels from this depth onward
			this.closePanelsFromIndex(newPanelDepth);
		}

		const updatedStack = this._panelStack();

		// `panelMaxVisible` represents the total visible columns in panel mode,
		// including the root column. The panel stack stores only subpanels, so
		// subtract one to get the visible subpanel limit.
		const effectiveMaxVisible = Math.max(1, maxVisible - 1);

		if (updatedStack.length >= effectiveMaxVisible) {
			// Max panels reached — drill-down within the last panel
			const lastPanel = updatedStack[updatedStack.length - 1];
			this.drillDownInPanel(lastPanel.id, parentItem, parentItem.children);
		} else {
			// Add a new panel
			const panel: HubNavPanelState = {
				id: `panel-${++this._panelIdCounter}`,
				parentItem,
				items: parentItem.children,
				history: [],
				isDrillDown: false
			};
			this._panelStack.update((stack) => [...stack, panel]);
		}
	}

	/**
	 * Finds the depth (index) where a panel for the given item should be placed.
	 * Returns the index of the first panel whose items contain parentItem,
	 * or -1 if parentItem is not found in any panel.
	 *
	 * @param parentItem - The item to search for.
	 * @param stack - The current panel stack.
	 * @returns The panel index, or -1 if not found.
	 */
	private findPanelDepth(parentItem: HubNavItem, stack: HubNavPanelState[]): number {
		for (let i = 0; i < stack.length; i++) {
			const panel = stack[i];
			if (panel.items.some((item) => item.id === parentItem.id)) {
				return i + 1; // New panel should go after this one
			}
		}
		return -1;
	}

	/**
	 * Finds the ordered list of dropdown ancestor IDs for the active route.
	 *
	 * @param items - Items to search recursively.
	 * @param activeRoute - Current router URL.
	 * @param trail - Accumulated ancestor trail.
	 * @returns Ancestor IDs that must remain expanded.
	 */
	private findActiveDropdownTrail(items: HubNavItem[], activeRoute: string, trail: string[] = []): string[] {
		for (const item of items) {
			if (!this.isItemOrDescendantActive(item, activeRoute)) {
				continue;
			}

			const nextTrail = item.children?.length ? [...trail, item.id] : trail;
			if (!item.children?.length) {
				return nextTrail;
			}

			const childTrail = this.findActiveDropdownTrail(item.children, activeRoute, nextTrail);
			return childTrail.length > 0 ? childTrail : nextTrail;
		}

		return [];
	}

	/**
	 * Closes a panel by its ID and all panels opened after it.
	 *
	 * @param panelId - ID of the panel to close.
	 */
	closePanel(panelId: string): void {
		const index = this._panelStack().findIndex((p) => p.id === panelId);
		if (index >= 0) {
			this.closePanelsFromIndex(index);
		}
	}

	/**
	 * Closes all panels from the given index onward.
	 *
	 * @param index - Zero-based index from which to start closing.
	 */
	closePanelsFromIndex(index: number): void {
		this._panelStack.update((stack) => stack.slice(0, index));
	}

	/** Closes all open panels. */
	closeAllPanels(): void {
		this._panelStack.set([]);
	}

	/**
	 * Performs a drill-down within an existing panel: pushes current items to history
	 * and replaces them with the new item's children.
	 *
	 * @param panelId - ID of the panel to drill down in.
	 * @param parentItem - The item whose children will replace the panel content.
	 * @param items - The new items to display.
	 */
	drillDownInPanel(panelId: string, parentItem: HubNavItem, items: HubNavItem[]): void {
		this._panelStack.update((stack) =>
			stack.map((panel) => {
				if (panel.id !== panelId) {
					return panel;
				}
				return {
					...panel,
					history: [...panel.history, { items: panel.items, parentLabel: panel.parentItem.label }],
					parentItem,
					items,
					isDrillDown: true
				};
			})
		);
	}

	/**
	 * Navigates back one level in a panel's drill-down history.
	 * If there is no history, the panel is closed.
	 *
	 * @param panelId - ID of the panel to navigate back in.
	 */
	navigateBackInPanel(panelId: string): void {
		const panel = this._panelStack().find((p) => p.id === panelId);
		if (!panel) {
			return;
		}

		if (panel.history.length === 0) {
			this.closePanel(panelId);
			return;
		}

		this._panelStack.update((stack) =>
			stack.map((p) => {
				if (p.id !== panelId) {
					return p;
				}
				const newHistory = [...p.history];
				const previous = newHistory.pop()!;
				return {
					...p,
					items: previous.items,
					parentItem: { ...p.parentItem, label: previous.parentLabel },
					history: newHistory,
					isDrillDown: newHistory.length > 0
				};
			})
		);
	}

	/**
	 * Retrieves a panel by its ID.
	 *
	 * @param panelId - ID of the panel to find.
	 * @returns The panel state, or `undefined` if not found.
	 */
	getPanelById(panelId: string): HubNavPanelState | undefined {
		return this._panelStack().find((p) => p.id === panelId);
	}

	/**
	 * Checks whether there is an open panel whose parent item matches the given ID.
	 *
	 * @param itemId - Parent item ID to match against the panel stack.
	 * @returns `true` when a panel for the given item is currently open.
	 */
	isPanelOpenForItem(itemId: string): boolean {
		return this._panelStack().some((panel) => panel.parentItem.id === itemId);
	}

	/**
	 * Resolves the effective expand mode for an item, considering:
	 * 1. Per-item `expandMode` override.
	 * 2. Global `verticalExpandMode` from config.
	 * 3. Fallback to `'accordion'` when collapsed (mobile).
	 *
	 * @param item - The item to resolve the expand mode for.
	 * @returns The effective expand mode.
	 */
	getEffectiveExpandMode(item: HubNavItem): HubNavVerticalExpandMode {
		// In horizontal mode, allow panel mode when explicitly configured.
		// Otherwise, keep flyout/dropdown behavior.
		if (this._config().orientation === 'horizontal') {
			return this._config().verticalExpandMode === 'panel' ? 'panel' : 'flyout';
		}
		const mode = item.expandMode ?? this._config().verticalExpandMode;
		// On mobile (collapsed), panel mode falls back to accordion
		if (mode === 'panel' && this._collapsed()) {
			return 'accordion';
		}
		// The rail has no room for inline expansion: accordion sections open
		// as overlay flyouts instead. Panel mode keeps its side panels.
		if (mode === 'accordion' && this.railActive()) {
			return 'flyout';
		}
		return mode;
	}

	// ──────────────────────────────────────────────
	// Active route detection
	// ──────────────────────────────────────────────

	/**
	 * Whether this is the item to mark among the ones it sits with.
	 *
	 * `isItemOrDescendantActive` keeps a section marked on everything below it,
	 * which is what stops a detail page from clearing the rail. The cost shows up
	 * between siblings: when one sits under another's path — `/products` and
	 * `/products/categories` — the shorter one matches the longer one's route too
	 * and both light up, so the rail claims you are in two places at once.
	 *
	 * The longest matching route wins. On `/products/categories` only the
	 * catalogue is marked; on `/products/42/edit` the list still is, because
	 * nothing more specific matches. An exact match is never overridden, and an
	 * item that matched through a descendant — a dropdown with no route of its
	 * own — keeps its mark: it is the section, not a competitor.
	 *
	 * @param item - Item being considered.
	 * @param siblings - The items rendered alongside it, itself included.
	 * @param activeRoute - Currently active route.
	 * @returns `true` when this item is the one to mark.
	 */
	isItemActiveAmongSiblings(item: HubNavItem, siblings: HubNavItem[], activeRoute: string): boolean {
		if (!this.isItemOrDescendantActive(item, activeRoute)) {
			return false;
		}

		const route = this.routeOf(item);

		if (!route) {
			return true;
		}

		const activePath = this.normalizePath(activeRoute.split('#')[0].split('?')[0]);

		if (route === activePath) {
			return true;
		}

		return !siblings.some((sibling) => {
			if (sibling === item) {
				return false;
			}

			const siblingRoute = this.routeOf(sibling);

			return !!siblingRoute && siblingRoute.length > route.length && this.isItemOrDescendantActive(sibling, activeRoute);
		});
	}

	/** An item's route as a single path, whichever shape it was declared in. */
	private routeOf(item: HubNavItem): string | null {
		if (!item.route) {
			return null;
		}

		return this.normalizePath(Array.isArray(item.route) ? item.route.join('/') : item.route);
	}

	/**
	 * A path in the one form these comparisons can trust: no trailing slash, except for the root.
	 *
	 * `/products` and `/products/` are the same place, and an application is free to decide which
	 * one it puts in the address bar — a canonical trailing-slash `UrlSerializer` is a common SEO
	 * choice. Comparing the two as raw strings makes the nav's marking depend on that choice:
	 * every item whose route was declared without the slash silently stopped matching, and only
	 * the ancestors stayed lit, because their prefix test happens to tolerate it.
	 *
	 * @param path - A route path, in either form.
	 * @returns The path without its trailing slash.
	 */
	private normalizePath(path: string): string {
		return path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;
	}

	/**
	 * Recursively checks whether the given item or any of its descendants
	 * match the provided active route.
	 *
	 * An item matches its own route and, unless it opts out with
	 * `routerLinkActiveOptions.exact`, anything below it: a rail that loses its
	 * mark the moment somebody opens a record leaves them with no idea where
	 * they are, which is the one question navigation exists to answer. The match
	 * is by whole segments, so `/products` is not marked by `/products-archive`.
	 *
	 * Marks every ancestor of the active route. To mark only the most specific
	 * of a set of siblings, use {@link isItemActiveAmongSiblings}.
	 *
	 * @param item - Item to check.
	 * @param activeRoute - Currently active route, optionally carrying a query
	 *   string and a fragment.
	 * @returns `true` if the item or a descendant is active.
	 */
	isItemOrDescendantActive(item: HubNavItem, activeRoute: string): boolean {
		if (item.route) {
			const route = this.routeOf(item)!;
			const [pathAndQuery, activeFragment] = activeRoute.split('#');
			const activePath = this.normalizePath(pathAndQuery.split('?')[0]);

			if (route === activePath) {
				// When an item defines a fragment, require exact fragment match.
				if (item.fragment) {
					if (item.fragment === activeFragment) {
						return true;
					}
				} else {
					return true;
				}
			}

			// Also handle activeRoute values without fragment split side effects.
			if (!item.fragment && route === activeRoute) {
				return true;
			}

			// A descendant route keeps the section marked. The trailing slash is
			// what makes this a segment test rather than a text one, and the root
			// is excluded because it prefixes every route there is.
			if (
				!item.fragment &&
				item.routerLinkActiveOptions?.exact !== true &&
				route !== '/' &&
				activePath.startsWith(`${route}/`)
			) {
				return true;
			}
		}
		if (item.children) {
			return item.children.some((child) => this.isItemOrDescendantActive(child, activeRoute));
		}
		return false;
	}
}
