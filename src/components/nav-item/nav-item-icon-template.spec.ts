import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HubNavComponent } from '../nav/nav.component';
import { HubNavItemIconDirective } from '../../directives/nav-item-icon.directive';
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

const items: HubNavItem[] = [
	{ id: 'home', label: 'Home', type: 'link', route: '/home', icon: 'house' },
	{ id: 'about', label: 'About', type: 'link', route: '/about' },
	{
		id: 'services',
		label: 'Services',
		type: 'dropdown',
		icon: 'grid',
		children: [{ id: 'web', label: 'Web', type: 'link', route: '/services/web' }]
	}
];

@Component({
	standalone: true,
	imports: [HubNavComponent, HubNavItemIconDirective],
	template: `
		<hub-nav [items]="items">
			<ng-template hubNavItemIcon let-item>
				<i class="projected-glyph" [attr.data-name]="item.icon"></i>
			</ng-template>
		</hub-nav>
	`
})
class IconTemplateHostComponent {
	readonly items = items;
}

@Component({
	standalone: true,
	imports: [HubNavComponent],
	template: `<hub-nav [items]="items" />`
})
class PlainHostComponent {
	readonly items = items;
}

/**
 * `icon` is a CSS class, which ties the menu to whatever icon font the page already loads. The
 * projected template is the escape hatch: it replaces the glyph and nothing else, so a consumer on
 * `ng-hub-ui-icons` stops maintaining a second icon vocabulary — without the nav taking a
 * dependency on it.
 */
describe('hubNavItemIcon', () => {
	beforeEach(async () => {
		mockMatchMedia();
		await TestBed.configureTestingModule({
			providers: [provideRouter([])]
		}).compileComponents();
	});

	it('should render the projected glyph in place of the icon class', () => {
		const fixture = TestBed.createComponent(IconTemplateHostComponent);
		fixture.detectChanges();

		const glyphs: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('.projected-glyph'));

		expect(glyphs.length).toBe(2);
		expect(glyphs.map((glyph) => glyph.dataset['name'])).toEqual(['house', 'grid']);
		expect(glyphs.every((glyph) => glyph.closest('.hub-nav-item__icon') !== null)).toBe(true);
	});

	it('should stop painting the icon class on the glyph wrapper', () => {
		const fixture = TestBed.createComponent(IconTemplateHostComponent);
		fixture.detectChanges();

		const wrapper: HTMLElement = fixture.nativeElement.querySelector('.hub-nav-item__icon');

		expect(wrapper.classList.contains('house')).toBe(false);
	});

	it('should leave an entry without an icon untouched', () => {
		const fixture = TestBed.createComponent(IconTemplateHostComponent);
		fixture.detectChanges();

		const about: HTMLElement = fixture.nativeElement.querySelector('[data-item-id="about"]');

		expect(about.querySelector('.hub-nav-item__icon')).toBeNull();
	});

	it('should keep painting the icon class when no template is projected', () => {
		const fixture = TestBed.createComponent(PlainHostComponent);
		fixture.detectChanges();

		const wrapper: HTMLElement = fixture.nativeElement.querySelector('.hub-nav-item__icon');

		expect(wrapper.classList.contains('house')).toBe(true);
	});
});
