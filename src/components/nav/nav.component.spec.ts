import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponentRef } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { HubNavComponent } from './nav.component';
import { HubNavItem } from '../../models/nav-item.model';

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

describe('HubNavComponent', () => {
	let component: HubNavComponent;
	let componentRef: ComponentRef<HubNavComponent>;
	let fixture: ComponentFixture<HubNavComponent>;

	const testItems: HubNavItem[] = [
		{ id: 'home', label: 'Home', type: 'link', route: '/home' },
		{ id: 'about', label: 'About', type: 'link', route: '/about' },
		{
			id: 'services',
			label: 'Services',
			type: 'dropdown',
			children: [
				{ id: 'web', label: 'Web', type: 'link', route: '/services/web' },
				{ id: 'design', label: 'Design', type: 'link', route: '/services/design' }
			]
		}
	];

	beforeEach(async () => {
		mockMatchMedia();
		await TestBed.configureTestingModule({
			imports: [HubNavComponent],
			providers: [provideRouter([])]
		}).compileComponents();

		fixture = TestBed.createComponent(HubNavComponent);
		component = fixture.componentInstance;
		componentRef = fixture.componentRef;
		componentRef.setInput('items', testItems);
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	describe('host classes', () => {
		it('should apply horizontal class by default', () => {
			expect(fixture.nativeElement.classList.contains('hub-nav--horizontal')).toBe(true);
			expect(fixture.nativeElement.classList.contains('hub-nav--vertical')).toBe(false);
		});

		it('should apply vertical class when orientation is vertical', () => {
			componentRef.setInput('config', { orientation: 'vertical' });
			fixture.detectChanges();
			expect(fixture.nativeElement.classList.contains('hub-nav--vertical')).toBe(true);
			expect(fixture.nativeElement.classList.contains('hub-nav--horizontal')).toBe(false);
		});

		it('should apply sticky class only when vertical', () => {
			componentRef.setInput('config', { orientation: 'vertical', position: 'sticky' });
			fixture.detectChanges();
			expect(fixture.nativeElement.classList.contains('hub-nav--sticky')).toBe(true);
		});

		it('should keep sticky class when vertical nav is collapsed', () => {
			componentRef.setInput('config', { orientation: 'vertical', position: 'sticky' });
			fixture.detectChanges();
			component.state.setCollapsed(true);
			fixture.detectChanges();
			expect(fixture.nativeElement.classList.contains('hub-nav--sticky')).toBe(true);
		});

		it('should not apply sticky class when horizontal', () => {
			componentRef.setInput('config', { position: 'sticky' });
			fixture.detectChanges();
			expect(fixture.nativeElement.classList.contains('hub-nav--sticky')).toBe(false);
		});

		it('should apply fixed class', () => {
			componentRef.setInput('config', { position: 'fixed' });
			fixture.detectChanges();
			expect(fixture.nativeElement.classList.contains('hub-nav--fixed')).toBe(true);
		});
	});

	describe('resolved config', () => {
		it('should use default config when no overrides provided', () => {
			const config = component.resolvedConfig();
			expect(config.orientation).toBe('horizontal');
			expect(config.dropdownTrigger).toBe('click');
			expect(config.collapseBreakpoint).toBe(992);
		});

		it('should merge config overrides with defaults', () => {
			componentRef.setInput('config', { orientation: 'vertical', dropdownTrigger: 'hover' });
			fixture.detectChanges();
			const config = component.resolvedConfig();
			expect(config.orientation).toBe('vertical');
			expect(config.dropdownTrigger).toBe('hover');
			expect(config.collapseBreakpoint).toBe(992);
		});
	});

	describe('ARIA', () => {
		it('should have default aria label', () => {
			expect(component.ariaLabel()).toBe('Navigation');
		});

		it('should update aria label from config', () => {
			componentRef.setInput('config', { ariaLabel: 'Main Navigation' });
			fixture.detectChanges();
			expect(component.ariaLabel()).toBe('Main Navigation');
		});

		it('announces horizontal orientation on the root menubar by default', () => {
			fixture.detectChanges();
			const menubar: HTMLElement | null = fixture.nativeElement.querySelector('[role="menubar"]');
			expect(menubar?.getAttribute('aria-orientation')).toBe('horizontal');
		});

		it('announces vertical orientation on the root menubar when the nav is vertical', () => {
			componentRef.setInput('config', { orientation: 'vertical' });
			fixture.detectChanges();
			const menubar: HTMLElement | null = fixture.nativeElement.querySelector('[role="menubar"]');
			expect(menubar?.getAttribute('aria-orientation')).toBe('vertical');
		});
	});

	describe('outputs', () => {
		it('should emit itemClick when a link item is clicked', () => {
			const spy = vi.fn();
			component.itemClick.subscribe(spy);
			component.onItemClick({ item: testItems[0], event: new MouseEvent('click') });
			expect(spy).toHaveBeenCalledWith(testItems[0]);
		});

		it('should emit itemClick for a section item that carries no route', () => {
			const spy = vi.fn();
			component.itemClick.subscribe(spy);
			component.onItemClick({ item: testItems[2], event: new MouseEvent('click') });
			expect(spy).toHaveBeenCalledWith(testItems[2]);
		});

		it('should emit mobileToggle on mobile toggle', () => {
			const spy = vi.fn();
			component.mobileToggle.subscribe(spy);
			component.onMobileToggle();
			expect(spy).toHaveBeenCalled();
		});

		it('should emit mobileToggle false on panel close', () => {
			const spy = vi.fn();
			component.mobileToggle.subscribe(spy);
			component.onMobilePanelClose();
			expect(spy).toHaveBeenCalledWith(false);
		});
	});

	describe('accent (color) resolution', () => {
		it('should resolve a semantic name to the ds token with a raw fallback', () => {
			componentRef.setInput('color', 'primary');
			fixture.detectChanges();
			expect(component.groupAccent()).toBe('var(--hub-sys-color-primary, primary)');
		});

		it('should pass a literal hex colour through unchanged', () => {
			componentRef.setInput('color', '#ff0000');
			fixture.detectChanges();
			expect(component.groupAccent()).toBe('#ff0000');
		});
	});

	describe('collapsed state', () => {
		it('should start not collapsed', () => {
			expect(component.isCollapsed()).toBe(false);
		});

		it('should start with mobile panel closed', () => {
			expect(component.isMobileOpen()).toBe(false);
		});
	});

	/**
	 * An accordion opens in place, so what the route has to open is its dropdown
	 * state — not the panel stack, which is the drill-down mechanism and is not
	 * even rendered in this mode. Deciding by collapsed-or-not alone left an
	 * expanded accordion with nothing opened from the route: the section a person
	 * had just navigated into stayed shut.
	 */
	describe('opening from the route in accordion mode', () => {
		beforeEach(() => {
			// The rail only reads the URL; the routes exist so the router can
			// resolve one at all.
			TestBed.inject(Router).resetConfig([{ path: '**', children: [] }]);
		});

		it('opens the section holding the active route', async () => {
			componentRef.setInput('items', testItems);
			componentRef.setInput('autoOpenFromRoute', true);
			componentRef.setInput('config', {
				orientation: 'vertical',
				verticalExpandMode: 'accordion'
			});

			await TestBed.inject(Router).navigateByUrl('/services/web');
			fixture.detectChanges();
			await fixture.whenStable();

			expect(component.state.isDropdownOpen('services')).toBe(true);
		});

		it('leaves the other sections shut', async () => {
			componentRef.setInput('items', testItems);
			componentRef.setInput('autoOpenFromRoute', true);
			componentRef.setInput('config', {
				orientation: 'vertical',
				verticalExpandMode: 'accordion'
			});

			await TestBed.inject(Router).navigateByUrl('/home');
			fixture.detectChanges();
			await fixture.whenStable();

			expect(component.state.isDropdownOpen('services')).toBe(false);
		});
	});

	/**
	 * Clicking an entry used to close every dropdown, which is right for a flyout —
	 * a transient menu that a click dismisses — and wrong for an accordion the
	 * route drives: the section being navigated into is the one about to reopen,
	 * so it blinked shut and open again on every click.
	 */
	describe('clicking an entry inside a route-driven accordion', () => {
		beforeEach(() => {
			TestBed.inject(Router).resetConfig([{ path: '**', children: [] }]);
			componentRef.setInput('items', testItems);
			componentRef.setInput('autoOpenFromRoute', true);
			componentRef.setInput('config', {
				orientation: 'vertical',
				verticalExpandMode: 'accordion'
			});
			fixture.detectChanges();
		});

		it('leaves its section open', () => {
			component.state.openDropdown('services');

			component.onItemClick({
				item: { id: 'web', label: 'Web', type: 'link', route: '/services/web' },
				event: new MouseEvent('click')
			});

			expect(component.state.isDropdownOpen('services')).toBe(true);
		});

		it('still dismisses a flyout, which is transient by design', () => {
			componentRef.setInput('config', {
				orientation: 'vertical',
				verticalExpandMode: 'flyout'
			});
			fixture.detectChanges();
			component.state.openDropdown('services');

			component.onItemClick({
				item: { id: 'web', label: 'Web', type: 'link', route: '/services/web' },
				event: new MouseEvent('click')
			});

			expect(component.state.isDropdownOpen('services')).toBe(false);
		});
	});

	describe('rail mode', () => {
		beforeEach(() => {
			componentRef.setInput('config', { orientation: 'vertical' });
			fixture.detectChanges();
		});

		it('should apply the rail class when rail is enabled on a vertical nav', () => {
			componentRef.setInput('rail', true);
			fixture.detectChanges();
			expect(fixture.nativeElement.classList.contains('hub-nav--rail')).toBe(true);
		});

		it('should not apply the rail class on a horizontal nav', () => {
			componentRef.setInput('config', { orientation: 'horizontal' });
			componentRef.setInput('rail', true);
			fixture.detectChanges();
			expect(fixture.nativeElement.classList.contains('hub-nav--rail')).toBe(false);
		});

		it('should ignore rail below the collapse breakpoint', () => {
			componentRef.setInput('rail', true);
			fixture.detectChanges();
			component.state.setCollapsed(true);
			fixture.detectChanges();
			expect(fixture.nativeElement.classList.contains('hub-nav--rail')).toBe(false);
		});

		it('should drop the inline full width so the rail token controls the host width', () => {
			expect(fixture.nativeElement.style.width).toBe('100%');
			componentRef.setInput('rail', true);
			fixture.detectChanges();
			expect(fixture.nativeElement.style.width).toBe('');
		});

		it('should expose the rail state to the start and end slot contexts', () => {
			componentRef.setInput('rail', true);
			fixture.detectChanges();
			expect(component.startContext().rail).toBe(true);
			expect(component.endContext().rail).toBe(true);
		});

		it('should force the overlay dropdown render mode while rail is active', () => {
			expect(component.dropdownRenderMode()).toBe('inline');
			componentRef.setInput('rail', true);
			fixture.detectChanges();
			expect(component.dropdownRenderMode()).toBe('overlay');
		});
	});

	describe('built-in rail toggle', () => {
		beforeEach(() => {
			componentRef.setInput('config', { orientation: 'vertical' });
			fixture.detectChanges();
		});

		const toggleButton = (): HTMLButtonElement | null => fixture.nativeElement.querySelector('hub-nav-rail-toggle button');

		it('should render on a vertical desktop nav by default', () => {
			expect(toggleButton()).not.toBeNull();
		});

		it('should not render when disabled through the config', () => {
			componentRef.setInput('config', { orientation: 'vertical', railToggle: false });
			fixture.detectChanges();
			expect(toggleButton()).toBeNull();
		});

		it('should not render on a horizontal nav', () => {
			componentRef.setInput('config', { orientation: 'horizontal' });
			fixture.detectChanges();
			expect(toggleButton()).toBeNull();
		});

		it('should not render below the collapse breakpoint', () => {
			component.state.setCollapsed(true);
			fixture.detectChanges();
			expect(toggleButton()).toBeNull();
		});

		it('should flip the rail state and report it through railChange', () => {
			const changes: boolean[] = [];
			component.rail.subscribe((value) => changes.push(value));

			toggleButton()!.click();
			fixture.detectChanges();
			expect(fixture.nativeElement.classList.contains('hub-nav--rail')).toBe(true);

			toggleButton()!.click();
			fixture.detectChanges();
			expect(fixture.nativeElement.classList.contains('hub-nav--rail')).toBe(false);
			expect(changes).toEqual([true, false]);
		});

		it('should announce the expanded state and swap its accessible label', () => {
			expect(toggleButton()!.getAttribute('aria-expanded')).toBe('true');
			expect(toggleButton()!.getAttribute('aria-label')).toBe('Collapse navigation');

			toggleButton()!.click();
			fixture.detectChanges();
			expect(toggleButton()!.getAttribute('aria-expanded')).toBe('false');
			expect(toggleButton()!.getAttribute('aria-label')).toBe('Expand navigation');
		});

		it('should pick up label overrides provided through the config input', () => {
			componentRef.setInput('config', {
				orientation: 'vertical',
				labels: { collapseNavigation: 'Plegar navegación' }
			});
			fixture.detectChanges();
			expect(toggleButton()!.getAttribute('aria-label')).toBe('Plegar navegación');
		});
	});
});
