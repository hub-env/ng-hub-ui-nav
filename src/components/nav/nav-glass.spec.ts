import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { compile } from 'sass';
import { HubNavComponent } from './nav.component';

/**
 * The nav follows the glass layer of ng-hub-ui-ds.
 *
 * The bar opts in with `hub-glass-surface` and reads the layer's values with opaque fallbacks, so
 * without the layer it paints exactly as before. It never blurs: it sits in the page flow, where a
 * blur has nothing behind it but the page backdrop. A panel opened inside it adds no tint of its own
 * (two tints stack into a near-opaque white) and no blur (inside the nav it would only blur the
 * nav's own fill).
 */
describe('nav glass layer', () => {
	/** Declarations of every rule whose selector list contains `selector`, joined. */
	function rule(css: string, selector: string): string {
		return [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
			.filter(([, sel]) =>
				// The first rule of a sheet is preceded by `@charset …;`, which the pattern takes in.
				sel
					.split(';')
					.pop()!
					.split(',')
					.some((s) => s.trim() === selector)
			)
			.map(([, , body]) => body)
			.join('\n');
	}

	const loadPaths = ['projects/nav/src/styles', 'projects/nav/src'];
	const navCss = compile('projects/nav/src/components/nav/nav.component.scss', { loadPaths }).css;
	const panelCss = compile('projects/nav/src/components/nav-panel/nav-panel.component.scss', { loadPaths }).css;

	it('marks the bar as a glass surface', async () => {
		Object.defineProperty(window, 'matchMedia', {
			writable: true,
			value: (query: string) => ({
				matches: false,
				media: query,
				addEventListener() {},
				removeEventListener() {},
				addListener() {},
				removeListener() {}
			})
		});
		await TestBed.configureTestingModule({
			imports: [HubNavComponent],
			providers: [provideRouter([])]
		}).compileComponents();
		const fixture = TestBed.createComponent(HubNavComponent);
		fixture.componentRef.setInput('items', [{ id: 'home', label: 'Home', type: 'link', route: '/home' }]);
		fixture.detectChanges();

		const nav: HTMLElement = fixture.nativeElement.querySelector('nav');
		expect(nav.classList).toContain('hub-glass-surface');
	});

	it('tints the bar with an opaque fallback and never blurs it', () => {
		const declarations = rule(navCss, 'nav');

		expect(declarations).toContain('var(--hub-sys-glass-opacity, 100%)');
		expect(declarations).toContain('var(--hub-sys-glass-sheen, none)');
		expect(declarations).toContain('var(--hub-sys-glass-rim');
		expect(declarations).not.toContain('backdrop-filter');
	});

	it('lets a panel inside the nav add no tint and no blur of its own', () => {
		const declarations = rule(panelCss, ':host');

		expect(declarations).toContain('var(--hub-sys-glass-inner-opacity, 100%)');
		expect(declarations).not.toContain('backdrop-filter');
	});
});
