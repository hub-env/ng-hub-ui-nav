import { ComponentRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Location } from '@angular/common';
import { provideLocationMocks } from '@angular/common/testing';
import { provideRouter, Router } from '@angular/router';
import { HubNavItem } from '../../models/nav-item.model';
import { HubNavComponent } from './nav.component';

/** Mock matchMedia for jsdom environments. */
function mockMatchMedia(): void {
	Object.defineProperty(window, 'matchMedia', {
		writable: true,
		value: vi.fn().mockImplementation((query: string) => ({
			matches: false,
			media: query,
			onchange: null,
			addListener: vi.fn(),
			removeListener: vi.fn(),
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			dispatchEvent: vi.fn()
		}))
	});
}

/**
 * A nav whose roots do not all expand the same way — the shape a documentation sidebar takes
 * once one section drills down into panels and another stays an in-place accordion.
 *
 * Each of the two mechanisms only ever clears its own: the panel branch rebuilds the stack and
 * the accordion branch rewrites the open-dropdown set. Crossing between roots is therefore the
 * one move nobody owns, and it left the reader looking at two open sections at once, one of
 * them the section they had just walked out of.
 */
describe('HubNavComponent crossing between roots of a mixed nav', () => {
	let component: HubNavComponent;
	let componentRef: ComponentRef<HubNavComponent>;
	let fixture: ComponentFixture<HubNavComponent>;

	/**
	 * Two sections that expand differently, plus a root parked on the language prefix, a root
	 * with no children at all, and a plain link. The language-prefix root is deliberate: its
	 * route matches every URL in the site, so it is what tells apart resolving the active root
	 * by the first match from resolving it by the most specific one.
	 */
	const mixedItems: HubNavItem[] = [
		{ id: 'home', label: 'Home', type: 'link', route: '/en/' },
		{
			id: 'docs',
			label: 'Docs',
			type: 'dropdown',
			route: '/en/docs/overview',
			children: [
				{ id: 'docs-overview', label: 'Overview', type: 'link', route: '/en/docs/overview' },
				{ id: 'docs-api', label: 'API', type: 'link', route: '/en/docs/api' }
			]
		},
		{
			id: 'guides',
			label: 'Guides',
			type: 'dropdown',
			expandMode: 'accordion',
			route: '/en/guides/intro',
			children: [
				{ id: 'guides-intro', label: 'Intro', type: 'link', route: '/en/guides/intro' },
				{ id: 'guides-advanced', label: 'Advanced', type: 'link', route: '/en/guides/advanced' }
			]
		},
		{ id: 'changelog', label: 'Changelog', type: 'dropdown', route: '/en/changelog', children: [] }
	];

	beforeEach(async () => {
		mockMatchMedia();
		Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1400 });
		await TestBed.configureTestingModule({
			imports: [HubNavComponent],
			providers: [provideRouter([]), provideLocationMocks()]
		}).compileComponents();

		fixture = TestBed.createComponent(HubNavComponent);
		component = fixture.componentInstance;
		componentRef = fixture.componentRef;
		// The nav only reads the URL; the catch-all lets the router resolve anything.
		const router = TestBed.inject(Router);
		router.resetConfig([{ path: '**', children: [] }]);
		// Without this the router ignores history events, and `Location.back()` would move the
		// mocked history without ever producing the navigation the nav listens to.
		router.setUpLocationChangeListener();
	});

	/** Mounts the mixed sidebar — panels by default, accordion where an item asks for it. */
	function mount(): void {
		componentRef.setInput('items', mixedItems);
		componentRef.setInput('autoOpenFromRoute', true);
		componentRef.setInput('config', {
			orientation: 'vertical',
			verticalExpandMode: 'panel',
			collapseBreakpoint: 992,
			panelMaxVisible: 2
		});
		fixture.detectChanges();
	}

	/** Settles the fixture on a URL, the way a navigation reaches the component. */
	async function goTo(url: string): Promise<void> {
		await TestBed.inject(Router).navigateByUrl(url);
		fixture.detectChanges();
		await fixture.whenStable();
		fixture.detectChanges();
	}

	/** The ids of every root whose panel is currently on the stack. */
	function openPanelRoots(): string[] {
		return component.state.panelStack().map((panel) => panel.parentItem.id);
	}

	it('drops the panel of the section left behind when the route lands on an accordion root', async () => {
		mount();
		await goTo('/en/docs/api');
		expect(openPanelRoots()).toContain('docs');

		await goTo('/en/guides/advanced');

		expect(component.state.isDropdownOpen('guides')).toBe(true);
		expect(openPanelRoots()).toEqual([]);
		expect(component.hasPanels()).toBe(false);
	});

	it('drops the accordion of the section left behind when the route lands on a panel root', async () => {
		mount();
		await goTo('/en/guides/advanced');
		expect(component.state.isDropdownOpen('guides')).toBe(true);

		await goTo('/en/docs/api');

		expect(openPanelRoots()).toEqual(['docs']);
		expect(component.state.isDropdownOpen('guides')).toBe(false);
	});

	/**
	 * The opposite mistake, and the easier one to make while fixing the first: moving inside the
	 * section you are already in must leave that section's panel standing.
	 */
	it('keeps the panel open while the route moves inside the same root', async () => {
		mount();
		await goTo('/en/docs/api');

		await goTo('/en/docs/overview');

		expect(openPanelRoots()).toEqual(['docs']);
		expect(component.hasPanels()).toBe(true);
	});

	/** And the accordion likewise stays expanded while its own entries are being visited. */
	it('keeps the accordion open while the route moves inside the same root', async () => {
		mount();
		await goTo('/en/guides/advanced');

		await goTo('/en/guides/intro');

		expect(component.state.isDropdownOpen('guides')).toBe(true);
		expect(openPanelRoots()).toEqual([]);
	});

	/**
	 * Going back is a navigation like any other, but it is the one a reader makes without
	 * touching the nav, so nothing else can correct the open state on the way.
	 */
	it('follows the browser back button across the two roots', async () => {
		mount();
		await goTo('/en/docs/api');
		await goTo('/en/guides/advanced');
		expect(openPanelRoots()).toEqual([]);

		TestBed.inject(Location).back();
		// The router answers a history entry change from a timer, so the navigation it starts
		// is not in flight yet when `back()` returns.
		await new Promise<void>((resolve) => setTimeout(resolve));
		fixture.detectChanges();
		await fixture.whenStable();
		fixture.detectChanges();

		expect(openPanelRoots()).toEqual(['docs']);
		expect(component.state.isDropdownOpen('guides')).toBe(false);
	});

	/** A root with nothing under it has nothing to open, so it must leave nothing open either. */
	it('leaves nothing open when the route lands on a root without children', async () => {
		mount();
		await goTo('/en/guides/advanced');

		await goTo('/en/changelog');

		expect(openPanelRoots()).toEqual([]);
		expect(component.state.isDropdownOpen('guides')).toBe(false);
	});

	/**
	 * A page outside the menu — a settings screen, a 404 — matches no item. Panels were already
	 * cleared there; the accordion was not, so the nav went on claiming the reader was inside a
	 * section they had left.
	 */
	it('leaves nothing open when the route is not in the nav at all', async () => {
		mount();
		await goTo('/en/guides/advanced');

		await goTo('/en/settings/profile');

		expect(openPanelRoots()).toEqual([]);
		expect(component.state.isDropdownOpen('guides')).toBe(false);
	});
});
