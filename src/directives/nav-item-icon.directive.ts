import { Directive, TemplateRef, inject } from '@angular/core';
import { HubNavItemIconContext } from '../models/nav-template-context.model';

/**
 * Replaces the glyph `<hub-nav>` draws for an entry that declares an `icon`, and nothing else.
 *
 * `HubNavItem.icon` is a CSS class, which ties a menu to whichever icon font the page already
 * loads and leaves an application on `ng-hub-ui-icons` maintaining a second icon vocabulary just
 * for its navigation. This template is the way out of that without the nav depending on any icon
 * library: the entry is the implicit context, so `icon` can carry a registry name, a pack
 * prefix, or anything else the application wants to read.
 *
 * Entries with no `icon` are untouched — they keep showing nothing, or the rail initial — so
 * projecting this template never changes the shape of the menu.
 *
 * @example
 * ```html
 * <hub-nav [items]="items">
 *   <ng-template hubNavItemIcon let-item>
 *     <hub-icon [name]="item.icon" />
 *   </ng-template>
 * </hub-nav>
 * ```
 */
@Directive({
	selector: '[hubNavItemIcon]',
	standalone: true
})
export class HubNavItemIconDirective {
	/** Reference to the template provided by the consumer. */
	readonly template = inject<TemplateRef<HubNavItemIconContext>>(TemplateRef);

	/**
	 * Narrows the implicit context so `let-item` types as a nav entry instead of `any`.
	 *
	 * @param _directive - The directive instance.
	 * @param _context - The candidate context.
	 * @returns Always `true`; exists only for the template type-checker.
	 */
	static ngTemplateContextGuard(_directive: HubNavItemIconDirective, _context: unknown): _context is HubNavItemIconContext {
		return true;
	}
}
