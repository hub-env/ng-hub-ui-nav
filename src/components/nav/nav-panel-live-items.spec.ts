import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponentRef } from '@angular/core';
import { provideRouter } from '@angular/router';
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

/**
 * An open panel has to keep showing what the `items` input says, not the array it was handed the
 * moment it opened. A menu that arrives from an API, a section that grows a new entry, a badge
 * that changes: all of them reach the component as a new `items` array while the panel is open.
 */
describe('HubNavComponent panel items follow the input', () => {
	let component: HubNavComponent;
	let componentRef: ComponentRef<HubNavComponent>;
	let fixture: ComponentFixture<HubNavComponent>;

	/** Builds the tree fresh each time so the test never mutates the array under the component. */
	function buildItems(reportLabels: string[]): HubNavItem[] {
		return [
			{
				id: 'reports',
				label: 'Reports',
				type: 'dropdown',
				children: reportLabels.map((label) => ({
					id: label.toLowerCase(),
					label,
					type: 'link' as const,
					route: `/reports/${label.toLowerCase()}`
				}))
			},
			{ id: 'settings', label: 'Settings', type: 'link', route: '/settings' }
		];
	}

	/** Labels currently painted by the panel stack, in order. */
	function panelLabels(): string[] {
		return Array.from(fixture.nativeElement.querySelectorAll('hub-nav-panel .hub-nav-item__label')).map((element) =>
			(element as HTMLElement).textContent!.trim()
		);
	}

	beforeEach(async () => {
		mockMatchMedia();
		await TestBed.configureTestingModule({
			imports: [HubNavComponent],
			providers: [provideRouter([])]
		}).compileComponents();

		fixture = TestBed.createComponent(HubNavComponent);
		component = fixture.componentInstance;
		componentRef = fixture.componentRef;
		componentRef.setInput('items', buildItems(['Sales', 'Stock']));
		componentRef.setInput('config', { orientation: 'vertical', verticalExpandMode: 'panel', collapseBreakpoint: 0 });
		fixture.detectChanges();
	});

	it('should paint an entry added to the open panel', () => {
		component.onPanelOpen(component.items()[0]);
		fixture.detectChanges();
		expect(panelLabels()).toEqual(['Sales', 'Stock']);

		componentRef.setInput('items', buildItems(['Sales', 'Stock', 'Margins']));
		fixture.detectChanges();

		expect(panelLabels()).toEqual(['Sales', 'Stock', 'Margins']);
	});

	it('should drop an entry removed from the open panel', () => {
		component.onPanelOpen(component.items()[0]);
		fixture.detectChanges();

		componentRef.setInput('items', buildItems(['Stock']));
		fixture.detectChanges();

		expect(panelLabels()).toEqual(['Stock']);
	});

	it('should keep the panel id so the open panel is not mounted again', () => {
		component.onPanelOpen(component.items()[0]);
		fixture.detectChanges();
		const idBefore = component.state.panelStack()[0].id;

		componentRef.setInput('items', buildItems(['Sales', 'Stock', 'Margins']));
		fixture.detectChanges();

		expect(component.state.panelStack()[0].id).toBe(idBefore);
	});

	it('should close a panel whose owning entry has left the menu', () => {
		component.onPanelOpen(component.items()[0]);
		fixture.detectChanges();
		expect(component.state.panelCount()).toBe(1);

		componentRef.setInput('items', [{ id: 'settings', label: 'Settings', type: 'link', route: '/settings' }]);
		fixture.detectChanges();

		expect(component.state.panelCount()).toBe(0);
	});

	it('should follow the input inside a panel the reader drilled into', () => {
		const items: HubNavItem[] = [
			{
				id: 'reports',
				label: 'Reports',
				type: 'dropdown',
				children: [
					{
						id: 'sales',
						label: 'Sales',
						type: 'dropdown',
						children: [{ id: 'q1', label: 'Q1', type: 'link', route: '/reports/sales/q1' }]
					}
				]
			}
		];
		componentRef.setInput('items', items);
		componentRef.setInput('config', {
			orientation: 'vertical',
			verticalExpandMode: 'panel',
			panelMaxVisible: 2,
			collapseBreakpoint: 0
		});
		fixture.detectChanges();

		component.onPanelOpen(items[0]);
		fixture.detectChanges();
		component.onPanelOpen(items[0].children![0]);
		fixture.detectChanges();
		expect(panelLabels()).toEqual(['Q1']);

		componentRef.setInput('items', [
			{
				id: 'reports',
				label: 'Reports',
				type: 'dropdown',
				children: [
					{
						id: 'sales',
						label: 'Sales',
						type: 'dropdown',
						children: [
							{ id: 'q1', label: 'Q1', type: 'link', route: '/reports/sales/q1' },
							{ id: 'q2', label: 'Q2', type: 'link', route: '/reports/sales/q2' }
						]
					}
				]
			}
		]);
		fixture.detectChanges();

		expect(panelLabels()).toEqual(['Q1', 'Q2']);
	});
});
