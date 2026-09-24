import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';
import { HubNavComponent } from '../components/nav/nav.component';
import { HubNavItem } from '../models/nav-item.model';
import { HubNavScrollSpySectionDirective } from './nav-scroll-spy-section.directive';
import { HubNavScrollSpyDirective } from './nav-scroll-spy.directive';

/** jsdom ships no `IntersectionObserver`; the container builds one as soon as it finds sections. */
class IntersectionObserverStub {
	constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
		void callback;
		void options;
	}

	observe(): void {}
	unobserve(): void {}
	disconnect(): void {}
}

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

/** Waits out the container's double `requestAnimationFrame` before it builds the observer. */
function afterFrames(): Promise<void> {
	return new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
}

/**
 * The shape both consumers were hand-rolling: an in-page rail beside the column that
 * actually scrolls, with the spy joining the two.
 */
@Component({
	standalone: true,
	imports: [HubNavComponent, HubNavScrollSpyDirective, HubNavScrollSpySectionDirective],
	template: `
		<hub-nav #rail [items]="items" />
		<div
			#body
			class="page-body"
			[hubNavScrollSpy]="true"
			[nav]="rail"
			[scrollContainer]="body"
			[clickSettleMs]="60"
			[offset]="0"
		>
			<section id="intro" hubNavScrollSpySection></section>
			<section id="usage" hubNavScrollSpySection></section>
			<section id="api" hubNavScrollSpySection></section>
		</div>
	`
})
class ScrollSpyNavHostComponent {
	items: HubNavItem[] = [
		{ id: 'intro', label: 'Intro', type: 'link' },
		{ id: 'usage', label: 'Usage', type: 'link' },
		{ id: 'api', label: 'API', type: 'link' }
	];
}

describe('hubNavScrollSpy — bound to a nav and to a scroll container', () => {
	let fixture: ComponentFixture<ScrollSpyNavHostComponent>;
	let spy: HubNavScrollSpyDirective;
	let body: HTMLElement;

	/** The `hub-nav-item` host element of an entry, found by the id it publishes. */
	function itemHost(id: string): HTMLElement {
		return fixture.nativeElement.querySelector(`hub-nav-item[data-item-id="${id}"]`) as HTMLElement;
	}

	beforeAll(() => {
		vi.stubGlobal('IntersectionObserver', IntersectionObserverStub);
		Element.prototype.scrollIntoView = vi.fn();
		Element.prototype.scrollTo = vi.fn();
	});

	beforeEach(async () => {
		mockMatchMedia();
		vi.mocked(Element.prototype.scrollIntoView).mockClear();
		vi.mocked(Element.prototype.scrollTo).mockClear();

		await TestBed.configureTestingModule({
			imports: [ScrollSpyNavHostComponent],
			providers: [provideRouter([])]
		}).compileComponents();

		fixture = TestBed.createComponent(ScrollSpyNavHostComponent);
		fixture.detectChanges();

		spy = fixture.debugElement.query(By.directive(HubNavScrollSpyDirective)).injector.get(HubNavScrollSpyDirective);
		body = fixture.nativeElement.querySelector('.page-body') as HTMLElement;

		await afterFrames();
		fixture.detectChanges();
	});

	it('marks the bound nav entry for the section under the reader, leaving the URL alone', () => {
		const urlBefore = TestBed.inject(Router).url;

		spy.scrollTo('usage', 'auto');
		fixture.detectChanges();

		expect(itemHost('usage').classList.contains('hub-nav-item--active')).toBe(true);
		expect(TestBed.inject(Router).url).toBe(urlBefore);
	});

	it('scrolls the container it was given instead of every ancestor of the section', () => {
		spy.scrollTo('usage', 'auto');

		expect(vi.mocked(body.scrollTo)).toHaveBeenCalled();
		expect(vi.mocked(Element.prototype.scrollIntoView)).not.toHaveBeenCalled();
	});

	it('scrolls to the section a click on the bound nav asked for', () => {
		const control = itemHost('api').querySelector('.hub-nav-item__link') as HTMLElement;

		control.click();
		fixture.detectChanges();

		expect(spy.activeSectionId()).toBe('api');
		expect(vi.mocked(body.scrollTo)).toHaveBeenCalled();
	});

	it('holds the section a click chose while the settle period runs, then lets go', async () => {
		spy.scrollTo('intro', 'auto');

		window.dispatchEvent(new Event('wheel'));
		body.dispatchEvent(new Event('scroll'));
		await afterFrames();

		expect(spy.activeSectionId()).toBe('intro');

		await new Promise((resolve) => setTimeout(resolve, 90));
		window.dispatchEvent(new Event('wheel'));
		body.dispatchEvent(new Event('scroll'));
		await afterFrames();

		expect(spy.activeSectionId()).toBe('api');
	});
});
