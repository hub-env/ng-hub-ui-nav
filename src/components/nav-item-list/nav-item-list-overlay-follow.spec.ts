import { ComponentRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideLocationMocks } from '@angular/common/testing';
import { provideRouter } from '@angular/router';
import { HubNavItem } from '../../models/nav-item.model';
import { HubNavComponent } from '../nav/nav.component';

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
 * A sidebar where one root expands in place and another opens a floating panel — the mixed shape
 * the documentation site demonstrates.
 *
 * Opening the flyout closes the accordion above it, and everything below the accordion rises to
 * fill the gap, the trigger included. Nothing scrolls and no window resizes, so the two events the
 * overlay listened to never fire: the panel stayed at the height the trigger had before the
 * collapse, orphaned halfway down the menu.
 *
 * jsdom lays nothing out, so the rise is what the test supplies — the trigger's box is moved by
 * hand, one step at a time, the way an animated collapse moves it. What is under test is that the
 * panel is re-placed each time it does.
 */
describe('An overlay dropdown whose trigger moves under it', () => {
	let component: HubNavComponent;
	let componentRef: ComponentRef<HubNavComponent>;
	let fixture: ComponentFixture<HubNavComponent>;

	const items: HubNavItem[] = [
		{
			id: 'catalog',
			label: 'Catalog',
			type: 'dropdown',
			children: [
				{ id: 'products', label: 'Products', type: 'link', route: '/catalog/products' },
				{ id: 'categories', label: 'Categories', type: 'link', route: '/catalog/categories' }
			]
		},
		{
			id: 'operations',
			label: 'Operations',
			type: 'dropdown',
			expandMode: 'flyout',
			children: [
				{ id: 'orders', label: 'Orders', type: 'link', route: '/operations/orders' },
				{ id: 'returns', label: 'Returns', type: 'link', route: '/operations/returns' }
			]
		}
	];

	beforeEach(async () => {
		mockMatchMedia();
		Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1400 });
		Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 900 });

		await TestBed.configureTestingModule({
			imports: [HubNavComponent],
			providers: [provideRouter([]), provideLocationMocks()]
		}).compileComponents();

		fixture = TestBed.createComponent(HubNavComponent);
		component = fixture.componentInstance;
		componentRef = fixture.componentRef;
	});

	afterEach(() => {
		fixture.destroy();
	});

	/** Mounts the mixed sidebar: accordion by default, one root overridden to a floating panel. */
	function mount(): void {
		componentRef.setInput('items', items);
		componentRef.setInput('config', {
			orientation: 'vertical',
			verticalExpandMode: 'accordion',
			dropdownRenderMode: 'overlay',
			collapseBreakpoint: 0
		});
		fixture.detectChanges();
	}

	/** Gives the flyout trigger a box the test can move, since jsdom gives it none. */
	function placeTrigger(top: number): (next: number) => void {
		const wrappers = fixture.nativeElement.querySelectorAll('.hub-nav-item-wrapper');
		const trigger = wrappers[1] as HTMLElement;
		let current = top;

		trigger.getBoundingClientRect = () =>
			({
				top: current,
				left: 0,
				width: 240,
				height: 40,
				right: 240,
				bottom: current + 40,
				x: 0,
				y: current,
				toJSON: () => ({})
			}) as DOMRect;

		return (next: number) => void (current = next);
	}

	/** The floating panel, as it lives in the body rather than inside the nav. */
	function panel(): HTMLElement | null {
		const containers = document.body.querySelectorAll('.hub-nav-overlay-container');

		return (containers[containers.length - 1] as HTMLElement) ?? null;
	}

	async function frames(count: number): Promise<void> {
		for (let index = 0; index < count; index++) {
			await new Promise((resolve) => requestAnimationFrame(resolve));
		}
	}

	it('follows the trigger up as the accordion above it collapses', async () => {
		mount();
		const moveTriggerTo = placeTrigger(300);

		// Both roots are opened the way a click opens them: the second one lists its siblings, so
		// the accordion above closes and the trigger starts its way up.
		component.state.openDropdown('catalog', ['catalog', 'operations']);
		fixture.detectChanges();
		component.state.openDropdown('operations', ['catalog', 'operations']);
		fixture.detectChanges();
		await frames(2);

		expect(panel()?.style.top).toBe('300px');

		// The collapse is animated: the trigger slides rather than jumps.
		for (const top of [260, 220, 180]) {
			moveTriggerTo(top);
			await frames(2);
		}

		expect(panel()?.style.top).toBe('180px');
	});

	it('leaves the panel where it is once the trigger settles', async () => {
		mount();
		const moveTriggerTo = placeTrigger(300);

		component.state.openDropdown('operations', ['catalog', 'operations']);
		fixture.detectChanges();
		moveTriggerTo(180);
		await frames(3);

		const settled = panel()?.style.top;
		await frames(4);

		expect(panel()?.style.top).toBe(settled);
		expect(settled).toBe('180px');
	});

	it('stops following a trigger whose panel has been closed', async () => {
		mount();
		const moveTriggerTo = placeTrigger(300);

		component.state.openDropdown('operations', ['catalog', 'operations']);
		fixture.detectChanges();
		await frames(2);

		component.state.closeDropdown('operations');
		fixture.detectChanges();
		moveTriggerTo(180);
		await frames(3);

		expect(panel()).toBeNull();
	});
});
