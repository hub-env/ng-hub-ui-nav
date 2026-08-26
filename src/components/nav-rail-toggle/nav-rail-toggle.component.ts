import { Component, ChangeDetectionStrategy, computed, inject, output } from '@angular/core';
import { HubNavStateService } from '../../services/nav-state.service';
import { HUB_NAV_DEFAULT_LABELS } from '../../models/nav-labels.model';

/**
 * Built-in rail toggle rendered on the outer edge of the primary column of a
 * vertical desktop nav. Shows an inward arrow while expanded and an outward
 * arrow while the rail is active; every visual aspect resolves from the
 * `--hub-nav-rail-toggle-*` tokens, including the arrow itself (an SVG
 * `mask-image` the consumer can replace through `--hub-nav-rail-toggle-icon`).
 *
 * @internal Used internally by `HubNavComponent`; disable it with
 * `config.railToggle: false` when the app ships its own toggle.
 */
@Component({
	selector: 'hub-nav-rail-toggle',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: {
		class: 'hub-nav-rail-toggle'
	},
	template: `
		<button
			type="button"
			class="hub-nav-rail-toggle__button"
			[class.hub-nav-rail-toggle__button--rail]="railActive()"
			[attr.aria-expanded]="!railActive()"
			[attr.aria-label]="label()"
			(click)="toggle.emit()"
		>
			<span class="hub-nav-rail-toggle__icon" aria-hidden="true"></span>
		</button>
	`,
	styles: [
		`
			:host {
				display: inline-flex;
			}

			.hub-nav-rail-toggle__button {
				display: inline-flex;
				align-items: center;
				justify-content: center;
				box-sizing: border-box;
				width: var(--hub-nav-rail-toggle-size, 1.75rem);
				height: var(--hub-nav-rail-toggle-size, 1.75rem);
				padding: var(--hub-nav-rail-toggle-padding, 0.25rem);
				color: var(--hub-nav-rail-toggle-color, var(--hub-nav-item-color, #212529));
				background-color: var(--hub-nav-rail-toggle-bg, var(--hub-sys-surface-elevated, #fff));
				border: var(--hub-nav-rail-toggle-border-width, 1px) solid
					var(--hub-nav-rail-toggle-border-color, var(--hub-nav-border-color, #dee2e6));
				border-radius: var(--hub-nav-rail-toggle-border-radius, var(--hub-ref-radius-pill, 50rem));
				box-shadow: var(
					--hub-nav-rail-toggle-shadow,
					var(--hub-sys-shadow-sm, 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075))
				);
				cursor: pointer;
				/* Complete transition value, matching the shape of the other ds tokens. */
				transition: var(--hub-nav-rail-toggle-transition, var(--hub-sys-transition-fast, all 0.15s ease-in-out));

				&:hover {
					color: var(--hub-nav-rail-toggle-hover-color, var(--hub-nav-item-hover-color, #0d6efd));
					background-color: var(--hub-nav-rail-toggle-hover-bg, var(--hub-nav-item-hover-bg, rgba(0, 0, 0, 0.04)));
				}

				&:focus-visible {
					outline: 2px solid var(--hub-sys-focus-ring-color, rgba(13, 110, 253, 0.25));
					outline-offset: 2px;
				}
			}

			/* The arrow is a mask so its color follows currentColor and the glyph */
			/* itself stays replaceable through --hub-nav-rail-toggle-icon. */
			.hub-nav-rail-toggle__icon {
				display: block;
				width: var(--hub-nav-rail-toggle-icon-size, 0.875em);
				height: var(--hub-nav-rail-toggle-icon-size, 0.875em);
				background-color: currentColor;
				mask: var(
						--hub-nav-rail-toggle-icon,
						url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z'/%3E%3C/svg%3E")
					)
					center / contain no-repeat;
				transition: var(--hub-nav-rail-toggle-transition, var(--hub-sys-transition-fast, all 0.15s ease-in-out));
			}

			/* Expanded points inward (collapse); rail points outward (expand). */
			.hub-nav-rail-toggle__button--rail .hub-nav-rail-toggle__icon {
				transform: rotate(180deg);
			}

			/* A right-hand sidebar mirrors both directions. */
			:host-context(.hub-nav--sidebar-right) .hub-nav-rail-toggle__icon {
				transform: rotate(180deg);
			}

			:host-context(.hub-nav--sidebar-right) .hub-nav-rail-toggle__button--rail .hub-nav-rail-toggle__icon {
				transform: rotate(0deg);
			}

			@media (prefers-reduced-motion: reduce) {
				.hub-nav-rail-toggle__button,
				.hub-nav-rail-toggle__icon {
					transition: none;
				}
			}
		`
	]
})
export class HubNavRailToggleComponent {
	/**
	 * Owning nav state, absent when the toggle is instantiated standalone;
	 * labels then fall back to the English defaults.
	 */
	private readonly state = inject(HubNavStateService, { optional: true });

	/** Whether the rail is effectively active on the owning nav. */
	readonly railActive = computed(() => this.state?.railActive() ?? false);

	/** Accessible label following the current rail state. */
	readonly label = computed(() => {
		const labels = this.state?.labels() ?? HUB_NAV_DEFAULT_LABELS;
		return this.railActive() ? labels.expandNavigation : labels.collapseNavigation;
	});

	/** Emitted when the toggle is activated; the nav flips its `rail` model. */
	readonly toggle = output<void>();
}
