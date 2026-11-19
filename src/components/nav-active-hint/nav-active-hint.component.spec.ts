import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { HubNavActiveHintComponent } from './nav-active-hint.component';
import { HubNavComponent } from '../nav/nav.component';
import { HubNavStateService } from '../../services/nav-state.service';
import { HubNavItem } from '../../models/nav-item.model';
import { HubNavConfig } from '../../models/nav-config.model';

/**
 * The pill that points back to an active entry scrolled out of the list.
 *
 * jsdom lays everything out as zeroes, so each test gives the container and the active row
 * the boxes it needs: a 200px-tall list, and a row placed above it, below it, or inside it.
 */
describe('HubNavActiveHintComponent', () => {
	let fixture: ComponentFixture<HubNavActiveHintComponent>;
	let container: HTMLElement;
	let row: HTMLElement;

	const items: HubNavItem[] = [
		{ id: 'a', label: 'Alpha', type: 'link', route: '/a', icon: 'icon-a' },
		{ id: 'b', label: 'Bravo', type: 'link', route: '/b', icon: 'icon-b' }
	];

	function box(top: number, height: number): DOMRect {
		return { top, bottom: top + height, left: 0, right: 100, width: 100, height, x: 0, y: top } as DOMRect;
	}

	/** Places the active row at `top`, relative to a list that spans 0–200px. */
	function placeRow(top: number): void {
		row.getBoundingClientRect = () => box(top, 40);
	}

	/** Lets the scheduled animation frame run, which is when the pill measures. */
	async function settle(): Promise<void> {
		fixture.detectChanges();
		await new Promise((resolve) => requestAnimationFrame(resolve));
		fixture.detectChanges();
	}

	function host(): HTMLElement {
		return fixture.nativeElement as HTMLElement;
	}

	function button(): HTMLButtonElement | null {
		return host().querySelector('.hub-nav-active-hint__button');
	}

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [HubNavActiveHintComponent],
			providers: [HubNavStateService, provideRouter([])]
		}).compileComponents();

		// The state defaults to a horizontal nav; these boxes describe a vertical list.
		const state = TestBed.inject(HubNavStateService);
		state.setConfig({ ...state.config(), orientation: 'vertical' });

		container = document.createElement('div');
		container.getBoundingClientRect = () => box(0, 200);
		container.scrollBy = vi.fn();

		row = document.createElement('hub-nav-item');
		row.className = 'hub-nav-item hub-nav-item--active';
		row.getClientRects = () => [box(0, 40)] as unknown as DOMRectList;
		row.appendChild(document.createElement('a')).setAttribute('tabindex', '0');
		container.appendChild(row);
		document.body.appendChild(container);

		fixture = TestBed.createComponent(HubNavActiveHintComponent);
		fixture.componentRef.setInput('items', items);
		fixture.componentRef.setInput('url', '/b');
		fixture.componentRef.setInput('container', container);
	});

	afterEach(() => container.remove());

	it('stays empty while the active row is in view', async () => {
		placeRow(80);
		await settle();

		expect(button()).toBeNull();
	});

	it('docks after the list when the active row is below it', async () => {
		placeRow(400);
		await settle();

		expect(host().classList).toContain('hub-nav-active-hint--after');
		expect(button()?.getAttribute('aria-label')).toBe('Scroll to Bravo');
		expect(host().querySelector('.hub-nav-active-hint__label')?.textContent).toBe('Bravo');
	});

	it('docks before the list when the active row is above it', async () => {
		placeRow(-300);
		await settle();

		expect(host().classList).toContain('hub-nav-active-hint--before');
		expect(button()).not.toBeNull();
	});

	/** Half the row hidden is the line: past it the reader can no longer read the entry. */
	it('counts a row as out of view once its centre leaves the list', async () => {
		placeRow(170);
		await settle();
		expect(button()).toBeNull();

		placeRow(190);
		container.dispatchEvent(new Event('scroll'));
		await settle();
		expect(host().classList).toContain('hub-nav-active-hint--after');
	});

	it('follows a scroll of the list', async () => {
		placeRow(400);
		await settle();
		expect(button()).not.toBeNull();

		placeRow(80);
		container.dispatchEvent(new Event('scroll'));
		await settle();
		expect(button()).toBeNull();
	});

	it('scrolls the list to centre the row and moves focus onto it', async () => {
		placeRow(400);
		await settle();

		button()!.click();

		// Row centre at 420, list centre at 100.
		expect(container.scrollBy).toHaveBeenCalledWith({ top: 320, behavior: 'smooth' });
		expect(document.activeElement).toBe(row.querySelector('a'));
	});

	it('names nothing when no entry is active', async () => {
		fixture.componentRef.setInput('url', '/elsewhere');
		placeRow(400);
		await settle();

		expect(button()).toBeNull();
	});

	it('marks itself for the hover mode', async () => {
		fixture.componentRef.setInput('mode', 'hover');
		placeRow(400);
		await settle();

		expect(host().classList).toContain('hub-nav-active-hint--hover');
	});
});

/** The nav renders the pill only when an application asks for it. */
describe('HubNavComponent outOfViewHint', () => {
	@Component({
		standalone: true,
		imports: [HubNavComponent],
		template: `<hub-nav [items]="items" [config]="config()" />`
	})
	class HostComponent {
		readonly items: HubNavItem[] = [{ id: 'a', label: 'Alpha', type: 'link', route: '/a' }];
		readonly config = signal<Partial<HubNavConfig>>({ orientation: 'vertical', collapseBreakpoint: 0 });
	}

	let fixture: ComponentFixture<HostComponent>;

	function pills(): NodeListOf<Element> {
		return (fixture.nativeElement as HTMLElement).querySelectorAll('hub-nav-active-hint');
	}

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [HostComponent],
			providers: [provideRouter([])]
		}).compileComponents();

		fixture = TestBed.createComponent(HostComponent);
		fixture.detectChanges();
	});

	it('is off by default', () => {
		expect(pills().length).toBe(0);
	});

	it.each(['vertical', 'horizontal'] as const)('renders beside the %s root list when asked', (orientation) => {
		fixture.componentInstance.config.set({ orientation, collapseBreakpoint: 0, outOfViewHint: 'always' });
		fixture.detectChanges();

		expect(pills().length).toBe(1);
	});

	it('takes a change of mode without being rebuilt', () => {
		fixture.componentInstance.config.set({ orientation: 'vertical', collapseBreakpoint: 0, outOfViewHint: 'always' });
		fixture.detectChanges();
		fixture.componentInstance.config.set({ orientation: 'vertical', collapseBreakpoint: 0, outOfViewHint: 'hover' });
		fixture.detectChanges();

		expect(pills()[0].classList).toContain('hub-nav-active-hint--hover');
	});
});
