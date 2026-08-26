import { Directive, TemplateRef, inject } from '@angular/core';
import { HubNavEndTemplateContext } from '../models/nav-template-context.model';

/**
 * Structural directive that projects content into the navigation end slot.
 *
 * Slot behavior:
 * - Horizontal nav: appears at the visual end (right in LTR, left in RTL).
 * - Vertical nav: appears at the bottom of the primary column.
 *
 * The template receives a {@link HubNavEndTemplateContext}.
 */
@Directive({
	selector: '[hubNavEnd]',
	standalone: true
})
export class HubNavEndDirective {
	/** Reference to the projected template. */
	readonly template = inject(TemplateRef<HubNavEndTemplateContext>);
}
