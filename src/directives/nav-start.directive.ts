import { Directive, TemplateRef, inject } from '@angular/core';
import { HubNavStartTemplateContext } from '../models/nav-template-context.model';

/**
 * Structural directive that projects content into the navigation start slot.
 *
 * Slot behavior:
 * - Horizontal nav: appears at the visual start (left in LTR, right in RTL).
 * - Vertical nav: appears at the top of the primary column.
 *
 * The template receives a {@link HubNavStartTemplateContext}.
 */
@Directive({
	selector: '[hubNavStart]',
	standalone: true
})
export class HubNavStartDirective {
	/** Reference to the projected template. */
	readonly template = inject(TemplateRef<HubNavStartTemplateContext>);
}
