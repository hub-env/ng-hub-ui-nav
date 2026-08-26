import { Component, ChangeDetectionStrategy, computed, inject, input, output } from '@angular/core';
import { HubNavStateService } from '../../services/nav-state.service';
import { HUB_NAV_DEFAULT_LABELS } from '../../models/nav-labels.model';

/**
 * Hamburger toggle button that shows/hides the mobile navigation panel.
 * Renders an animated three-line icon that transforms into an X when open.
 *
 * @internal Used internally by `HubNavComponent` when the viewport is below the collapse breakpoint.
 */
@Component({
	selector: 'hub-nav-toggler',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: {
		class: 'hub-nav-toggler'
	},
	template: `
		<button
			type="button"
			class="hub-nav-toggler__button"
			[class.hub-nav-toggler__button--open]="isOpen()"
			[attr.aria-expanded]="isOpen()"
			[attr.aria-label]="toggleLabel()"
			(click)="toggle.emit()"
		>
			<span class="hub-nav-toggler__icon">
				<span class="hub-nav-toggler__bar"></span>
				<span class="hub-nav-toggler__bar"></span>
				<span class="hub-nav-toggler__bar"></span>
			</span>
		</button>
	`,
	styles: [
		`
			:host {
				display: inline-flex;
				flex-shrink: 0;
			}

			.hub-nav-toggler__button {
				display: inline-flex;
				align-items: center;
				justify-content: center;
				padding: var(--hub-nav-toggler-padding-y, 0.25rem) var(--hub-nav-toggler-padding-x, 0.5rem);
				font-size: var(--hub-nav-toggler-font-size, 1.25rem);
				color: var(--hub-nav-toggler-color, #212529);
				background: none;
				border: 1px solid var(--hub-nav-toggler-border-color, #dee2e6);
				border-radius: var(--hub-nav-toggler-border-radius, 0.25rem);
				cursor: pointer;
				transition: background-color var(--hub-nav-item-transition, 150ms ease);

				&:hover {
					background-color: var(--hub-nav-item-hover-bg, rgba(0, 0, 0, 0.04));
				}

				&:focus-visible {
					outline: 2px solid var(--hub-sys-focus-ring-color, rgba(13, 110, 253, 0.25));
					outline-offset: -2px;
				}
			}

			.hub-nav-toggler__icon {
				display: flex;
				flex-direction: column;
				gap: 4px;
				width: 1.5em;
				height: 1.5em;
				justify-content: center;
			}

			.hub-nav-toggler__bar {
				display: block;
				width: 100%;
				height: 2px;
				background-color: currentColor;
				border-radius: 1px;
				transition:
					transform 0.3s ease,
					opacity 0.3s ease;
				transform-origin: center;
			}

			/* Animated X state */
			.hub-nav-toggler__button--open {
				.hub-nav-toggler__bar:nth-child(1) {
					transform: translateY(6px) rotate(45deg);
				}
				.hub-nav-toggler__bar:nth-child(2) {
					opacity: 0;
				}
				.hub-nav-toggler__bar:nth-child(3) {
					transform: translateY(-6px) rotate(-45deg);
				}
			}

			@media (prefers-reduced-motion: reduce) {
				.hub-nav-toggler__bar {
					transition: none;
				}
			}
		`
	]
})
export class HubNavTogglerComponent {
	/**
	 * Owning nav state, absent when the toggler is instantiated standalone
	 * (e.g. in isolated tests); labels then fall back to the English defaults.
	 */
	private readonly state = inject(HubNavStateService, { optional: true });

	/** Accessible label resolved through the nav's localizable labels. */
	readonly toggleLabel = computed(() => this.state?.labels().toggleNavigation ?? HUB_NAV_DEFAULT_LABELS.toggleNavigation);

	/** Whether the mobile panel is currently open. */
	readonly isOpen = input<boolean>(false);

	/** Emitted when the toggler is clicked. */
	readonly toggle = output<void>();
}
