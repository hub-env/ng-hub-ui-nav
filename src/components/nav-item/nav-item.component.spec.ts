import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponentRef } from '@angular/core';
import { provideRouter } from '@angular/router';
import { HubNavItemComponent } from './nav-item.component';
import { HubNavStateService } from '../../services/nav-state.service';
import { HubNavItem } from '../../models/nav-item.model';

describe('HubNavItemComponent', () => {
	let component: HubNavItemComponent;
	let componentRef: ComponentRef<HubNavItemComponent>;
	let fixture: ComponentFixture<HubNavItemComponent>;

	const linkItem: HubNavItem = {
		id: 'home',
		label: 'Home',
		type: 'link',
		route: '/home',
		icon: 'bi bi-house'
	};

	const dropdownItem: HubNavItem = {
		id: 'services',
		label: 'Services',
		type: 'dropdown',
		children: [{ id: 'web', label: 'Web', type: 'link', route: '/services/web' }]
	};

	const routableDropdownItem: HubNavItem = {
		id: 'docs',
		label: 'Docs',
		type: 'dropdown',
		route: '/docs',
		children: [{ id: 'intro', label: 'Intro', type: 'link', route: '/docs/intro' }]
	};

	const disabledItem: HubNavItem = {
		id: 'disabled',
		label: 'Disabled',
		type: 'link',
		route: '/disabled',
		disabled: true
	};

	const headerItem: HubNavItem = {
		id: 'header',
		label: 'Section Header',
		type: 'header'
	};

	const separatorItem: HubNavItem = {
		id: 'sep',
		label: '',
		type: 'separator'
	};

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [HubNavItemComponent],
			providers: [HubNavStateService, provideRouter([])]
		}).compileComponents();

		fixture = TestBed.createComponent(HubNavItemComponent);
		component = fixture.componentInstance;
		componentRef = fixture.componentRef;
		componentRef.setInput('item', linkItem);
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	describe('computed properties', () => {
		it('should detect link type', () => {
			expect(component.isLink()).toBe(true);
			expect(component.isDropdown()).toBe(false);
		});

		it('should detect dropdown type', () => {
			componentRef.setInput('item', dropdownItem);
			fixture.detectChanges();
			expect(component.isDropdown()).toBe(true);
			expect(component.hasChildren()).toBe(true);
		});

		it('should detect header type', () => {
			componentRef.setInput('item', headerItem);
			fixture.detectChanges();
			expect(component.isHeader()).toBe(true);
		});

		it('should detect no children for simple link', () => {
			expect(component.hasChildren()).toBe(false);
		});

		it('should resolve string route to array', () => {
			expect(component.resolvedRoute()).toEqual(['/home']);
		});

		it('should pass through array route', () => {
			componentRef.setInput('item', { ...linkItem, route: ['/home', 'sub'] });
			fixture.detectChanges();
			expect(component.resolvedRoute()).toEqual(['/home', 'sub']);
		});

		it('should return null route for items without route', () => {
			componentRef.setInput('item', headerItem);
			fixture.detectChanges();
			expect(component.resolvedRoute()).toBeNull();
		});
	});

	describe('host classes', () => {
		it('should apply disabled class', () => {
			componentRef.setInput('item', disabledItem);
			fixture.detectChanges();
			expect(fixture.nativeElement.classList.contains('hub-nav-item--disabled')).toBe(true);
		});

		it('should apply active class when isActive input is true', () => {
			componentRef.setInput('isActive', true);
			fixture.detectChanges();
			expect(fixture.nativeElement.classList.contains('hub-nav-item--active')).toBe(true);
		});

		it('should apply expanded class', () => {
			componentRef.setInput('item', dropdownItem);
			componentRef.setInput('isExpanded', true);
			fixture.detectChanges();
			expect(fixture.nativeElement.classList.contains('hub-nav-item--expanded')).toBe(true);
		});

		it('should apply header class', () => {
			componentRef.setInput('item', headerItem);
			fixture.detectChanges();
			expect(fixture.nativeElement.classList.contains('hub-nav-item--header')).toBe(true);
		});

		it('should set data-item-id attribute', () => {
			expect(fixture.nativeElement.getAttribute('data-item-id')).toBe('home');
		});
	});

	describe('onItemClick()', () => {
		it('should emit clicked event for link item', () => {
			const spy = vi.fn();
			component.clicked.subscribe(spy);
			const event = new MouseEvent('click');
			component.onItemClick(event);
			expect(spy).toHaveBeenCalledWith({ item: linkItem, event });
		});

		it('should prevent default for disabled items', () => {
			componentRef.setInput('item', disabledItem);
			fixture.detectChanges();
			const event = new MouseEvent('click');
			const preventSpy = vi.spyOn(event, 'preventDefault');
			component.onItemClick(event);
			expect(preventSpy).toHaveBeenCalled();
		});

		it('should prevent default for header items', () => {
			componentRef.setInput('item', headerItem);
			fixture.detectChanges();
			const event = new MouseEvent('click');
			const preventSpy = vi.spyOn(event, 'preventDefault');
			component.onItemClick(event);
			expect(preventSpy).toHaveBeenCalled();
		});

		it('should prevent default for separator items', () => {
			componentRef.setInput('item', separatorItem);
			fixture.detectChanges();
			const event = new MouseEvent('click');
			const preventSpy = vi.spyOn(event, 'preventDefault');
			component.onItemClick(event);
			expect(preventSpy).toHaveBeenCalled();
		});

		it('should emit toggleDropdown for items with children', () => {
			componentRef.setInput('item', dropdownItem);
			fixture.detectChanges();
			const spy = vi.fn();
			component.toggleDropdown.subscribe(spy);
			component.onItemClick(new MouseEvent('click'));
			expect(spy).toHaveBeenCalledWith(dropdownItem);
		});

		it('should not toggle dropdown when clicking the route area of a routable dropdown', () => {
			componentRef.setInput('item', routableDropdownItem);
			fixture.detectChanges();
			const toggleSpy = vi.fn();
			const clickSpy = vi.fn();
			component.toggleDropdown.subscribe(toggleSpy);
			component.clicked.subscribe(clickSpy);

			component.onRouteItemClick(new MouseEvent('click'));

			expect(clickSpy).toHaveBeenCalled();
			expect(toggleSpy).not.toHaveBeenCalled();
		});

		it('should only toggle dropdown when clicking the caret of a routable dropdown', () => {
			componentRef.setInput('item', routableDropdownItem);
			fixture.detectChanges();
			const toggleSpy = vi.fn();
			const clickSpy = vi.fn();
			component.toggleDropdown.subscribe(toggleSpy);
			component.clicked.subscribe(clickSpy);

			component.onCaretClick(new MouseEvent('click'));

			expect(toggleSpy).toHaveBeenCalledWith(routableDropdownItem);
			expect(clickSpy).not.toHaveBeenCalled();
		});
	});

	describe('template context', () => {
		it('should provide correct template context', () => {
			componentRef.setInput('isActive', true);
			componentRef.setInput('isExpanded', false);
			componentRef.setInput('depth', 2);
			fixture.detectChanges();

			const ctx = component.templateContext();
			expect(ctx.$implicit).toBe(linkItem);
			expect(ctx.active).toBe(true);
			expect(ctx.expanded).toBe(false);
			expect(ctx.depth).toBe(2);
		});
	});

	describe('rail mode', () => {
		beforeEach(() => {
			const state = TestBed.inject(HubNavStateService);
			state.setConfig({ ...state.config(), orientation: 'vertical', verticalExpandMode: 'accordion' });
			state.setRail(true);
		});

		it('should hide the caret while rail is active', () => {
			componentRef.setInput('item', routableDropdownItem);
			fixture.detectChanges();
			expect(component.showCaret()).toBe(false);
			expect(fixture.nativeElement.querySelector('.hub-nav-item__caret-button')).toBeNull();
		});

		it('should expose aria-expanded on the caret-less routable trigger', () => {
			componentRef.setInput('item', routableDropdownItem);
			componentRef.setInput('isExpanded', true);
			fixture.detectChanges();
			const link = fixture.nativeElement.querySelector('.hub-nav-item__link');
			expect(link.getAttribute('aria-expanded')).toBe('true');
			expect(link.getAttribute('aria-haspopup')).toBe('true');
		});

		it('should expose the rail state in the custom template context', () => {
			componentRef.setInput('item', linkItem);
			fixture.detectChanges();
			expect(component.templateContext().rail).toBe(true);
		});
	});

	describe('labels', () => {
		it('should build the caret toggle label from the configured section label', () => {
			const state = TestBed.inject(HubNavStateService);
			state.setConfig({ ...state.config(), labels: { toggleSection: 'Alternar {label}' } });
			componentRef.setInput('item', routableDropdownItem);
			fixture.detectChanges();
			const caret = fixture.nativeElement.querySelector('.hub-nav-item__caret-button');
			expect(caret.getAttribute('aria-label')).toBe('Alternar Docs');
		});
	});
});
