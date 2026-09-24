import { compile } from 'sass';

/**
 * A nav item paints its hover and active label on a tint of its own accent, so the pair is
 * composed rather than declared: neither half means anything without the other. The label read
 * the raw accent — a colour chosen to be a colour, not ink — and on the 12% tint the active
 * entry sits on it measured 3.88:1, under the 4.5:1 a label is owed.
 *
 * What this suite fixes is the derivation, not a number. The numbers come from
 * `npm run contrast:pages`, which measures the composed pair in a real browser; nothing here
 * evaluates `oklch(from …)` or `color-mix()`, and a test that pretended to would be measuring
 * its own arithmetic rather than the stylesheet.
 */

const sheet = compile('projects/nav/src/styles/nav-tokens.scss').css;

/** Every value a custom property is given anywhere in the sheet. */
function declarations(token: string): string[] {
	return [...sheet.matchAll(new RegExp(`${token}:\\s*([^;]+)`, 'g'))].map((match) => match[1].replace(/\s+/g, ' ').trim());
}

describe('the ink a nav item writes its label in', () => {
	it('steers the emphasis role into the theme window, in every block that declares it', () => {
		const declared = declarations('--hub-nav-accent-emphasis');

		// Two blocks declare it: the default, and the one that re-bases a variant's accent. The
		// second was missed the first time this was fixed, which left every custom accent — the
		// whole point of the open variant set — with the defect the first block had lost.
		expect(declared.length).toBeGreaterThanOrEqual(2);
		for (const value of declared) {
			expect(value, 'a percentage mix cannot darken a pale accent').not.toContain('color-mix');
			expect(value).toContain('--hub-sys-emphasis-lightness-max');
		}
	});

	it.each(['--hub-nav-item-active-color', '--hub-nav-item-hover-color'])('paints %s with that ink', (token) => {
		for (const value of declarations(token)) {
			expect(value).toBe('var(--hub-nav-accent-emphasis)');
		}
	});

	it('leaves the on-accent flip alone: it sits on the accent itself, not on a tint of it', () => {
		for (const value of declarations('--hub-nav-accent-on')) {
			expect(value).toContain('clamp(0, (0.62 - l) * 1000, 1)');
		}
	});
});
