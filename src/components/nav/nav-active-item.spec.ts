import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HubNavComponent } from './nav.component';
import { HubNavItem } from '../../models/nav-item.model';

/** Mock matchMedia for jsdom environments, which ships none. */
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
 * A rail of in-page sections: entries with no route at all, which is the shape the
 * consuming products were left hand-marking because the nav could not mark them.
 */
@Component({
	standalone: true,
	imports: [HubNavComponent],
	template: ` <hub-nav [items]="items()" [activeItemId]="activeItemId()" (itemClick)="clicked.push($event)" /> `
})
class NavActiveItemHostComponent {
	readonly items = signal<HubNavItem[]>([
		{ id: 'intro', label: 'Intro', type: 'link' },
		{ id: 'usage', label: 'Usage', type: 'link', cssClass: 'rail-entry' },
		{ id: 'api', label: 'API', type: 'link', route: '/api' }
	]);

	readonly activeItemId = signal<string | null>(null);

	clicked: HubNavItem[] = [];
}

describe('hub-nav — marking and reporting an entry that has no route', () => {
	let fixture: ComponentFixture<NavActiveItemHostComponent>;
	let host: NavActiveItemHostComponent;

	/** The `hub-nav-item` host element of an entry, found by the id it publishes. */
	function itemHost(id: string): HTMLElement {
		return fixture.nativeElement.querySelector(`hub-nav-item[data-item-id="${id}"]`) as HTMLElement;
	}

	/** The clickable control of an entry, whichever branch of the item template drew it. */
	function itemControl(id: string): HTMLElement {
		return itemHost(id).querySelector('.hub-nav-item__link') as HTMLElement;
	}

	beforeEach(async () => {
		mockMatchMedia();

		await TestBed.configureTestingModule({
			imports: [NavActiveItemHostComponent],
			providers: [provideRouter([])]
		}).compileComponents();

		fixture = TestBed.createComponent(NavActiveItemHostComponent);
		host = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('reports a click on an entry that carries no route', () => {
		itemControl('intro').click();
		fixture.detectChanges();

		expect(host.clicked.map((item) => item.id)).toEqual(['intro']);
	});

	it('marks the entry named by activeItemId, route or no route', () => {
		host.activeItemId.set('usage');
		fixture.detectChanges();

		expect(itemHost('usage').classList.contains('hub-nav-item--active')).toBe(true);
		expect(itemControl('usage').classList.contains('hub-nav-item__link--active')).toBe(true);
	});

	it('announces an explicit mark as a location rather than a page', () => {
		host.activeItemId.set('usage');
		fixture.detectChanges();

		expect(itemControl('usage').getAttribute('aria-current')).toBe('location');
	});

	it('lets activeItemId outrank the route, so two entries are never marked at once', () => {
		host.activeItemId.set('usage');
		fixture.detectChanges();

		expect(itemHost('api').classList.contains('hub-nav-item--active')).toBe(false);
	});

	it('honours the per-item active flag without any route matching', () => {
		host.items.update((items) => [{ ...items[0], active: true }, ...items.slice(1)]);
		fixture.detectChanges();

		expect(itemHost('intro').classList.contains('hub-nav-item--active')).toBe(true);
	});

	it('paints the per-item cssClass on the item element', () => {
		const element = itemHost('usage');

		expect(element.classList.contains('rail-entry')).toBe(true);
		expect(element.classList.contains('hub-nav-item')).toBe(true);
	});
});
