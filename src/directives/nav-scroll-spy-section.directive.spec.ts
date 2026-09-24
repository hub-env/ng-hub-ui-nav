import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { HubNavScrollSpySectionDirective } from './nav-scroll-spy-section.directive';
import { HubNavScrollSpyDirective } from './nav-scroll-spy.directive';

/** Elements handed to the observer, in the order the container registered them. */
const observed: Element[] = [];

/** jsdom ships no `IntersectionObserver`; the container builds one as soon as it finds sections. */
class IntersectionObserverStub {
	constructor(
		private readonly callback: IntersectionObserverCallback,
		private readonly options?: IntersectionObserverInit
	) {
		void this.callback;
		void this.options;
	}

	observe(target: Element): void {
		observed.push(target);
	}

	unobserve(): void {}
	disconnect(): void {}
}

/**
 * The form the README teaches: a valueless `hubNavScrollSpySection` beside a plain `id`.
 *
 * Angular initialises the aliased input of a static valueless attribute with the empty
 * string, so this host is the one that regressed — the third section, which passes the id
 * through the attribute, never stopped working.
 */
@Component({
	standalone: true,
	imports: [HubNavScrollSpyDirective, HubNavScrollSpySectionDirective],
	template: `
		<div [hubNavScrollSpy]="true" (activeSectionChange)="activeSection = $event">
			<section id="overview" hubNavScrollSpySection></section>
			<section id="api" hubNavScrollSpySection></section>
			<section hubNavScrollSpySection="anchors"></section>
			<section hubNavScrollSpySection></section>
		</div>
	`
})
class ScrollSpyHostComponent {
	activeSection: string | null = null;
}

/** Waits out the container's double `requestAnimationFrame` before it builds the observer. */
function afterObserverInit(): Promise<void> {
	return new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
}

describe('HubNavScrollSpySectionDirective', () => {
	let fixture: ComponentFixture<ScrollSpyHostComponent>;
	let sections: HTMLElement[];

	// Installed once for the file: a fixture torn down mid-flight still runs its pending
	// animation frame, and removing the stub between tests makes that frame throw.
	beforeAll(() => {
		vi.stubGlobal('IntersectionObserver', IntersectionObserverStub);
		Element.prototype.scrollIntoView = vi.fn();
		// With no container declared the jump falls to the window, which jsdom does not implement.
		vi.stubGlobal('scrollTo', vi.fn());
	});

	beforeEach(async () => {
		observed.length = 0;

		await TestBed.configureTestingModule({
			imports: [ScrollSpyHostComponent]
		}).compileComponents();

		fixture = TestBed.createComponent(ScrollSpyHostComponent);
		fixture.detectChanges();
		sections = Array.from(fixture.nativeElement.querySelectorAll('section')) as HTMLElement[];
	});

	it('falls back to the host id when the attribute carries no value', () => {
		expect(sections[0].getAttribute('data-hub-nav-scroll-spy-section')).toBe('overview');
		expect(sections[1].getAttribute('data-hub-nav-scroll-spy-section')).toBe('api');
	});

	it('keeps an explicit section id over the host id', () => {
		expect(sections[2].getAttribute('data-hub-nav-scroll-spy-section')).toBe('anchors');
	});

	it('marks nothing when neither the attribute nor the host carries an id', () => {
		expect(sections[3].hasAttribute('data-hub-nav-scroll-spy-section')).toBe(false);
	});

	it('lets the container observe the sections declared in the valueless form', async () => {
		await afterObserverInit();

		expect(observed).toContain(sections[0]);
		expect(observed).toContain(sections[1]);
	});

	it('resolves a valueless section by its host id when the container is asked for it', () => {
		const spy = fixture.debugElement.query(By.directive(HubNavScrollSpyDirective)).injector.get(HubNavScrollSpyDirective);

		expect(spy.scrollTo('overview', 'auto')).toBe(true);
		expect(fixture.componentInstance.activeSection).toBe('overview');
	});
});
