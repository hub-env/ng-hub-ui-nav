import { Directive, ElementRef, computed, inject, input } from '@angular/core';

/**
 * Marks an element as a trackable section for `HubNavScrollSpyDirective`.
 *
 * If no explicit section id is provided, the directive falls back to the host
 * element `id` attribute.
 */
@Directive({
	selector: '[hubNavScrollSpySection]',
	standalone: true,
	host: {
		'[attr.data-hub-nav-scroll-spy-section]': 'resolvedSectionId() || null'
	}
})
export class HubNavScrollSpySectionDirective {
	/** Optional section id. When omitted, host `id` is used. */
	readonly sectionId = input<string | null>(null, { alias: 'hubNavScrollSpySection' });

	private readonly el = inject(ElementRef<HTMLElement>);

	/** Effective section id exposed to the container directive. */
	readonly resolvedSectionId = computed(() => this.sectionId() ?? this.el.nativeElement.id ?? null);
}
