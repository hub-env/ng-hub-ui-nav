import { TestBed } from '@angular/core/testing';
import { HubTranslationService, HUB_TRANSLATION_CONFIG } from 'ng-hub-ui-utils';
import { HubNavStateService } from './nav-state.service';
import { HubNavItem } from '../models/nav-item.model';

describe('HubNavStateService', () => {
	let service: HubNavStateService;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [HubNavStateService]
		});
		service = TestBed.inject(HubNavStateService);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});

	describe('config management', () => {
		it('should have default orientation as horizontal', () => {
			expect(service.orientation()).toBe('horizontal');
		});

		it('should update config via setConfig()', () => {
			service.setConfig({
				orientation: 'vertical',
				verticalExpandMode: 'flyout',
				dropdownTrigger: 'hover',
				position: 'sticky',
				stickyTop: '4rem',
				collapseMode: 'dropdown',
				collapseBreakpoint: 768,
				offcanvasPosition: 'end',
				ariaLabel: 'Main',
				panelMaxVisible: 3,
				sidebarSide: 'left',
				panelWidth: '16rem',
				dropdownRenderMode: 'inline'
			});
			expect(service.orientation()).toBe('vertical');
			expect(service.verticalExpandMode()).toBe('flyout');
			expect(service.dropdownTrigger()).toBe('hover');
		});
	});

	describe('dropdown management', () => {
		it('should start with no open dropdowns', () => {
			expect(service.isDropdownOpen('test')).toBe(false);
		});

		it('should open a dropdown', () => {
			service.openDropdown('products');
			expect(service.isDropdownOpen('products')).toBe(true);
		});

		it('should close a dropdown', () => {
			service.openDropdown('products');
			service.closeDropdown('products');
			expect(service.isDropdownOpen('products')).toBe(false);
		});

		it('should toggle a closed dropdown to open', () => {
			const result = service.toggleDropdown('products');
			expect(result).toBe(true);
			expect(service.isDropdownOpen('products')).toBe(true);
		});

		it('should toggle an open dropdown to closed', () => {
			service.openDropdown('products');
			const result = service.toggleDropdown('products');
			expect(result).toBe(false);
			expect(service.isDropdownOpen('products')).toBe(false);
		});

		it('should track multiple open dropdowns independently', () => {
			service.openDropdown('products');
			service.openDropdown('services');
			expect(service.isDropdownOpen('products')).toBe(true);
			expect(service.isDropdownOpen('services')).toBe(true);

			service.closeDropdown('products');
			expect(service.isDropdownOpen('products')).toBe(false);
			expect(service.isDropdownOpen('services')).toBe(true);
		});

		it('should close all dropdowns', () => {
			service.openDropdown('products');
			service.openDropdown('services');
			service.closeAllDropdowns();
			expect(service.isDropdownOpen('products')).toBe(false);
			expect(service.isDropdownOpen('services')).toBe(false);
		});

		it('should synchronize open dropdowns with the active route trail', () => {
			const items: HubNavItem[] = [
				{
					id: 'calendar',
					label: 'Calendar',
					type: 'dropdown',
					children: [
						{ id: 'calendar-overview', label: 'Overview', type: 'link', route: '/calendar/overview' },
						{
							id: 'calendar-examples',
							label: 'Examples',
							type: 'dropdown',
							route: '/calendar/examples',
							children: [
								{
									id: 'calendar-example-basic',
									label: 'Basic',
									type: 'link',
									route: '/calendar/examples',
									fragment: 'calendar-basic'
								}
							]
						}
					]
				}
			];

			service.syncDropdownsWithRoute(items, '/calendar/examples#calendar-basic');

			expect(service.isDropdownOpen('calendar')).toBe(true);
			expect(service.isDropdownOpen('calendar-examples')).toBe(true);
		});
	});

	describe('mobile state', () => {
		it('should start with mobile panel closed', () => {
			expect(service.mobileOpen()).toBe(false);
		});

		it('should set mobile open state', () => {
			service.setMobileOpen(true);
			expect(service.mobileOpen()).toBe(true);
		});

		it('should toggle mobile state', () => {
			service.toggleMobile();
			expect(service.mobileOpen()).toBe(true);
			service.toggleMobile();
			expect(service.mobileOpen()).toBe(false);
		});
	});

	describe('collapsed state', () => {
		it('should start not collapsed', () => {
			expect(service.collapsed()).toBe(false);
		});

		it('should set collapsed state', () => {
			service.setCollapsed(true);
			expect(service.collapsed()).toBe(true);
		});

		it('should close mobile panel when un-collapsing', () => {
			service.setCollapsed(true);
			service.setMobileOpen(true);
			service.setCollapsed(false);
			expect(service.mobileOpen()).toBe(false);
		});

		it('should keep mobile panel open when collapsing', () => {
			service.setMobileOpen(true);
			service.setCollapsed(true);
			expect(service.mobileOpen()).toBe(true);
		});
	});

	describe('panel stack management', () => {
		const parentItem: HubNavItem = {
			id: 'docs',
			label: 'Documentation',
			type: 'dropdown',
			children: [
				{ id: 'getting-started', label: 'Getting Started', type: 'link', route: '/docs/start' },
				{
					id: 'guides',
					label: 'Guides',
					type: 'dropdown',
					children: [{ id: 'routing', label: 'Routing', type: 'link', route: '/docs/routing' }]
				}
			]
		};

		const parentItem2: HubNavItem = {
			id: 'components',
			label: 'Components',
			type: 'dropdown',
			children: [{ id: 'buttons', label: 'Buttons', type: 'link', route: '/components/buttons' }]
		};

		it('should start with empty panel stack', () => {
			expect(service.panelStack()).toEqual([]);
			expect(service.panelCount()).toBe(0);
		});

		it('should open a panel for a parent item', () => {
			service.openPanel(parentItem);
			expect(service.panelCount()).toBe(1);
			expect(service.panelStack()[0].parentItem).toBe(parentItem);
			expect(service.panelStack()[0].items).toBe(parentItem.children!);
		});

		it('should not open a panel if item has no children', () => {
			const noChildren: HubNavItem = { id: 'solo', label: 'Solo', type: 'link' };
			service.openPanel(noChildren);
			expect(service.panelCount()).toBe(0);
		});

		it('should close a panel by its ID', () => {
			service.openPanel(parentItem);
			const panelId = service.panelStack()[0].id;
			service.closePanel(panelId);
			expect(service.panelCount()).toBe(0);
		});

		it('should close all panels', () => {
			service.openPanel(parentItem);
			service.openPanel(parentItem2);
			service.closeAllPanels();
			expect(service.panelCount()).toBe(0);
		});

		it('should toggle panel: close if already open for same item', () => {
			service.openPanel(parentItem);
			expect(service.panelCount()).toBe(1);
			service.openPanel(parentItem); // same item → close
			expect(service.panelCount()).toBe(0);
		});

		it('should drill down when max panels reached', () => {
			service.setConfig({
				...service.config(),
				panelMaxVisible: 1
			});
			service.openPanel(parentItem);
			expect(service.panelCount()).toBe(1);

			// Opening another should drill-down in the existing panel
			service.openPanel(parentItem2);
			expect(service.panelCount()).toBe(1);
			expect(service.panelStack()[0].isDrillDown).toBe(true);
			expect(service.panelStack()[0].items).toBe(parentItem2.children!);
		});

		it('should navigate back in drill-down history', () => {
			service.setConfig({
				...service.config(),
				panelMaxVisible: 1
			});
			service.openPanel(parentItem);
			service.openPanel(parentItem2); // drills down
			const panelId = service.panelStack()[0].id;

			service.navigateBackInPanel(panelId);
			expect(service.panelStack()[0].items).toBe(parentItem.children!);
			expect(service.panelStack()[0].isDrillDown).toBe(false);
		});

		it('should close panel if navigating back with no history', () => {
			service.openPanel(parentItem);
			const panelId = service.panelStack()[0].id;
			service.navigateBackInPanel(panelId);
			expect(service.panelCount()).toBe(0);
		});

		it('should find panel by ID', () => {
			service.openPanel(parentItem);
			const panelId = service.panelStack()[0].id;
			const found = service.getPanelById(panelId);
			expect(found).toBeTruthy();
			expect(found?.parentItem).toBe(parentItem);
		});

		it('should return undefined for unknown panel ID', () => {
			expect(service.getPanelById('nonexistent')).toBeUndefined();
		});
	});

	describe('getEffectiveExpandMode()', () => {
		it('should return item expandMode override when set', () => {
			service.setConfig({
				...service.config(),
				orientation: 'vertical'
			});
			const item: HubNavItem = { id: 'test', label: 'Test', type: 'dropdown', expandMode: 'panel' };
			expect(service.getEffectiveExpandMode(item)).toBe('panel');
		});

		it('should fall back to config verticalExpandMode', () => {
			service.setConfig({
				...service.config(),
				orientation: 'vertical',
				verticalExpandMode: 'flyout'
			});
			const item: HubNavItem = { id: 'test', label: 'Test', type: 'dropdown' };
			expect(service.getEffectiveExpandMode(item)).toBe('flyout');
		});

		it('should return accordion for panel mode when collapsed (mobile fallback)', () => {
			service.setConfig({
				...service.config(),
				orientation: 'vertical',
				verticalExpandMode: 'panel'
			});
			service.setCollapsed(true);
			const item: HubNavItem = { id: 'test', label: 'Test', type: 'dropdown' };
			expect(service.getEffectiveExpandMode(item)).toBe('accordion');
		});

		it('should not apply mobile fallback when not collapsed', () => {
			service.setConfig({
				...service.config(),
				orientation: 'vertical',
				verticalExpandMode: 'panel'
			});
			const item: HubNavItem = { id: 'test', label: 'Test', type: 'dropdown' };
			expect(service.getEffectiveExpandMode(item)).toBe('panel');
		});
	});

	describe('isItemOrDescendantActive()', () => {
		const testItems: HubNavItem[] = [
			{ id: 'home', label: 'Home', type: 'link', route: '/home' },
			{
				id: 'services',
				label: 'Services',
				type: 'dropdown',
				children: [
					{ id: 'web', label: 'Web', type: 'link', route: '/services/web' },
					{
						id: 'design',
						label: 'Design',
						type: 'dropdown',
						children: [{ id: 'ui', label: 'UI', type: 'link', route: '/services/design/ui' }]
					}
				]
			}
		];

		it('should return true for a direct route match', () => {
			expect(service.isItemOrDescendantActive(testItems[0], '/home')).toBe(true);
		});

		it('should return false for no match', () => {
			expect(service.isItemOrDescendantActive(testItems[0], '/about')).toBe(false);
		});

		it('should return true when a child route matches', () => {
			expect(service.isItemOrDescendantActive(testItems[1], '/services/web')).toBe(true);
		});

		it('should return true when a deeply nested child route matches', () => {
			expect(service.isItemOrDescendantActive(testItems[1], '/services/design/ui')).toBe(true);
		});

		it('should return false for a dropdown with no matching descendant', () => {
			expect(service.isItemOrDescendantActive(testItems[1], '/about')).toBe(false);
		});

		it('should handle array routes', () => {
			const item: HubNavItem = { id: 'arr', label: 'Arr', type: 'link', route: ['/services', 'web'] };
			expect(service.isItemOrDescendantActive(item, '/services/web')).toBe(true);
		});

		it('should stay active on a route below its own', () => {
			expect(service.isItemOrDescendantActive(testItems[0], '/home/42/edit')).toBe(true);
		});

		/**
		 * `/home` and `/home/` are the same place, and an application decides which one reaches
		 * the address bar — a canonical trailing-slash `UrlSerializer` is an ordinary SEO choice.
		 * Comparing raw strings made the marking depend on that choice: every item declared
		 * without the slash stopped matching, and only its ancestors stayed lit, because their
		 * prefix test happens to tolerate one.
		 */
		it('matches a trailing-slash URL against a route declared without one', () => {
			expect(service.isItemOrDescendantActive(testItems[0], '/home/')).toBe(true);
		});

		it('matches a trailing-slash route against a URL without one', () => {
			const item: HubNavItem = { id: 'home', label: 'Home', type: 'link', route: '/home/' };
			expect(service.isItemOrDescendantActive(item, '/home')).toBe(true);
		});

		it('keeps the root route intact rather than emptying it', () => {
			const root: HubNavItem = { id: 'root', label: 'Root', type: 'link', route: '/' };
			expect(service.isItemOrDescendantActive(root, '/')).toBe(true);
		});

		/**
		 * The case this was found on: a page whose examples are one route apart only by fragment,
		 * under a serializer that emits the canonical trailing slash. Nothing in the panel was
		 * ever marked, and the scroll spy — which writes the fragment as you scroll — appeared
		 * dead for the same reason.
		 */
		it('matches a fragment item under a trailing-slash serializer', () => {
			const item: HubNavItem = {
				id: 'example',
				label: 'Select',
				type: 'link',
				route: '/en/forms/examples',
				fragment: 'forms-select'
			};

			expect(service.isItemOrDescendantActive(item, '/en/forms/examples/#forms-select')).toBe(true);
			expect(service.isItemOrDescendantActive(item, '/en/forms/examples/#forms-datepicker')).toBe(false);
		});

		/** Only the section actually scrolled to is marked, never the whole run at once. */
		it('marks a single fragment sibling', () => {
			const siblings: HubNavItem[] = [
				{ id: 'a', label: 'A', type: 'link', route: '/en/forms/examples', fragment: 'a' },
				{ id: 'b', label: 'B', type: 'link', route: '/en/forms/examples', fragment: 'b' },
				{ id: 'group', label: 'Group', type: 'header' }
			];

			const active = siblings.filter((item) =>
				service.isItemActiveAmongSiblings(item, siblings, '/en/forms/examples/#b')
			);

			expect(active.map((item) => item.id)).toEqual(['b']);
		});

		it('should keep a dropdown marked while one of its children holds the page', () => {
			expect(service.isItemOrDescendantActive(testItems[1], '/services/web/7')).toBe(true);
		});

		it('should not be fooled by a route that merely starts with the same text', () => {
			expect(service.isItemOrDescendantActive(testItems[0], '/homepage')).toBe(false);
		});

		it('should match only its own route when the item asks for an exact match', () => {
			const item: HubNavItem = {
				id: 'exact',
				label: 'Exact',
				type: 'link',
				route: '/home',
				routerLinkActiveOptions: { exact: true }
			};

			expect(service.isItemOrDescendantActive(item, '/home')).toBe(true);
			expect(service.isItemOrDescendantActive(item, '/home/42')).toBe(false);
		});

		it('should not let a root item claim every route', () => {
			const item: HubNavItem = { id: 'root', label: 'Root', type: 'link', route: '/' };

			expect(service.isItemOrDescendantActive(item, '/')).toBe(true);
			expect(service.isItemOrDescendantActive(item, '/customers')).toBe(false);
		});

		it('should ignore the query string when matching', () => {
			expect(service.isItemOrDescendantActive(testItems[0], '/home?page=2')).toBe(true);
			expect(service.isItemOrDescendantActive(testItems[0], '/home/42?tab=notes')).toBe(true);
		});
	});

	/**
	 * A section stays marked on the routes below it — that is what keeps a detail
	 * page from clearing the rail. The cost is that a sibling sitting *under*
	 * another's path (`/products` and `/products/categories`) matches it too, and
	 * both light up. The longest matching route has to win.
	 */
	describe('marking among siblings', () => {
		const siblings: HubNavItem[] = [
			{ id: 'list', label: 'Products', type: 'link', route: '/products' },
			{ id: 'categories', label: 'Categories', type: 'link', route: '/products/categories' },
			{ id: 'warehouses', label: 'Warehouses', type: 'link', route: '/products/warehouses' }
		];

		it('marks only the most specific sibling when several match', () => {
			const active = '/products/categories';

			expect(service.isItemActiveAmongSiblings(siblings[1], siblings, active)).toBe(true);
			expect(service.isItemActiveAmongSiblings(siblings[0], siblings, active)).toBe(false);
			expect(service.isItemActiveAmongSiblings(siblings[2], siblings, active)).toBe(false);
		});

		it('keeps the list marked on a record below it, where nothing else matches', () => {
			const active = '/products/42/edit';

			expect(service.isItemActiveAmongSiblings(siblings[0], siblings, active)).toBe(true);
			expect(service.isItemActiveAmongSiblings(siblings[1], siblings, active)).toBe(false);
		});

		it('never lets a prefix match override an exact one', () => {
			const active = '/products';

			expect(service.isItemActiveAmongSiblings(siblings[0], siblings, active)).toBe(true);
		});

		it('keeps a parent marked when it matched through a descendant', () => {
			const group: HubNavItem = {
				id: 'group',
				label: 'Products',
				type: 'dropdown',
				children: siblings
			};

			expect(service.isItemActiveAmongSiblings(group, [group], '/products/categories')).toBe(true);
		});
	});

	describe('rail mode', () => {
		const verticalConfig = () => {
			service.setConfig({
				...service.config(),
				orientation: 'vertical',
				verticalExpandMode: 'accordion'
			});
		};

		it('should not be active by default', () => {
			expect(service.railActive()).toBe(false);
		});

		it('should activate for a vertical nav when rail is set', () => {
			verticalConfig();
			service.setRail(true);
			expect(service.railActive()).toBe(true);
		});

		it('should stay inactive for a horizontal nav', () => {
			service.setRail(true);
			expect(service.railActive()).toBe(false);
		});

		it('should be ignored below the collapse breakpoint', () => {
			verticalConfig();
			service.setRail(true);
			service.setCollapsed(true);
			expect(service.railActive()).toBe(false);
		});

		it('should resolve accordion items to flyout while active', () => {
			verticalConfig();
			const item: HubNavItem = {
				id: 'group',
				label: 'Group',
				type: 'dropdown',
				children: [{ id: 'child', label: 'Child', type: 'link', route: '/child' }]
			};
			expect(service.getEffectiveExpandMode(item)).toBe('accordion');
			service.setRail(true);
			expect(service.getEffectiveExpandMode(item)).toBe('flyout');
		});

		it('should keep the mobile accordion fallback when collapsed', () => {
			verticalConfig();
			service.setRail(true);
			service.setCollapsed(true);
			const item: HubNavItem = {
				id: 'group',
				label: 'Group',
				type: 'dropdown',
				children: [{ id: 'child', label: 'Child', type: 'link', route: '/child' }]
			};
			expect(service.getEffectiveExpandMode(item)).toBe('accordion');
		});

		it('should force the click trigger while active', () => {
			service.setConfig({ ...service.config(), orientation: 'vertical', dropdownTrigger: 'hover' });
			service.setRail(true);
			expect(service.dropdownTrigger()).toBe('click');
		});

		it('should close open dropdowns when the rail state flips', () => {
			verticalConfig();
			service.openDropdown('products');
			service.setRail(true);
			expect(service.isDropdownOpen('products')).toBe(false);
		});
	});

	describe('labels', () => {
		it('should resolve the English defaults', () => {
			const labels = service.labels();
			expect(labels.toggleNavigation).toBe('Toggle navigation');
			expect(labels.closeNavigation).toBe('Close navigation');
			expect(labels.goBack).toBe('Go back');
			expect(labels.closePanel).toBe('Close panel');
			expect(labels.collapseNavigation).toBe('Collapse navigation');
			expect(labels.expandNavigation).toBe('Expand navigation');
		});

		it('should interpolate the item label into the section toggle label', () => {
			expect(service.toggleSectionLabel('Products')).toBe('Toggle Products');
		});

		it('should prefer labels provided through the config', () => {
			service.setConfig({
				...service.config(),
				labels: { closeNavigation: 'Cerrar navegación', toggleSection: 'Alternar {label}' }
			});
			expect(service.labels().closeNavigation).toBe('Cerrar navegación');
			expect(service.toggleSectionLabel('Productos')).toBe('Alternar Productos');
			expect(service.labels().goBack).toBe('Go back');
		});
	});
});

describe('HubNavStateService with the shared translation dictionary', () => {
	let service: HubNavStateService;
	let translations: HubTranslationService;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [
				HubNavStateService,
				HubTranslationService,
				{
					provide: HUB_TRANSLATION_CONFIG,
					useValue: {
						dictionaries: {
							en: { HUBUI: { NAV: { CLOSE_NAVIGATION: 'Dismiss navigation' } } }
						}
					}
				}
			]
		});
		service = TestBed.inject(HubNavStateService);
		translations = TestBed.inject(HubTranslationService);
	});

	it('should resolve labels from HUBUI.NAV keys', () => {
		expect(service.labels().closeNavigation).toBe('Dismiss navigation');
		expect(service.labels().goBack).toBe('Go back');
	});

	it('should update labels when the dictionary emits a new language', () => {
		translations.setTranslations({ HUBUI: { NAV: { CLOSE_NAVIGATION: 'Cerrar navegación' } } });
		expect(service.labels().closeNavigation).toBe('Cerrar navegación');
	});
});
