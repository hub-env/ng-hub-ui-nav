import { Injectable, InjectionToken, signal } from '@angular/core';
import { HubNavConfig } from '../models/nav-config.model';

/**
 * Default configuration values for the `hub-nav` component.
 */
const DEFAULT_NAV_CONFIG: HubNavConfig = {
	orientation: 'horizontal',
	verticalExpandMode: 'accordion',
	dropdownTrigger: 'click',
	position: 'static',
	stickyTop: '0px',
	collapseMode: 'offcanvas',
	collapseBreakpoint: 992,
	offcanvasPosition: 'start',
	ariaLabel: 'Navigation',
	panelMaxVisible: 3,
	sidebarSide: 'left',
	panelWidth: '16rem',
	dropdownRenderMode: 'inline',
	railToggle: true,
	activeIndicator: false,
	followReplacedUrls: true,
	outOfViewHint: 'off'
};

/**
 * Injection token for providing global nav configuration at application startup.
 *
 * @example
 * ```typescript
 * import { HUB_NAV_CONFIG } from 'ng-hub-ui-nav';
 *
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     {
 *       provide: HUB_NAV_CONFIG,
 *       useValue: {
 *         orientation: 'vertical',
 *         dropdownTrigger: 'hover',
 *         collapseBreakpoint: 768
 *       }
 *     }
 *   ]
 * };
 * ```
 */
export const HUB_NAV_CONFIG = new InjectionToken<Partial<HubNavConfig>>('HUB_NAV_CONFIG');

/**
 * Global configuration service for `hub-nav` components.
 * Provides centralized configuration management with signal-based reactivity.
 *
 * @example
 * ```typescript
 * const configService = inject(HubNavConfigService);
 * configService.updateConfig({ orientation: 'vertical' });
 * const config = configService.getConfig();
 * ```
 */
@Injectable({
	providedIn: 'root'
})
export class HubNavConfigService {
	/** Signal containing the current global configuration. */
	private config = signal<HubNavConfig>({ ...DEFAULT_NAV_CONFIG });

	/**
	 * Returns the current configuration as a readonly signal.
	 *
	 * @returns Readonly signal with the current `HubNavConfig`.
	 */
	getConfig() {
		return this.config.asReadonly();
	}

	/**
	 * Returns the default configuration values.
	 *
	 * @returns A copy of the default `HubNavConfig`.
	 */
	getDefaults(): HubNavConfig {
		return { ...DEFAULT_NAV_CONFIG };
	}

	/**
	 * Merges the given partial configuration into the current config.
	 *
	 * @param partial - Partial configuration to merge.
	 */
	updateConfig(partial: Partial<HubNavConfig>): void {
		this.config.update((current) => ({
			...current,
			...partial
		}));
	}

	/**
	 * Resets the configuration to factory defaults.
	 */
	resetToDefaults(): void {
		this.config.set({ ...DEFAULT_NAV_CONFIG });
	}

	/**
	 * Resolves a complete config by merging defaults with the given partial overrides.
	 * Used internally by `hub-nav` to merge component-level inputs with global defaults.
	 *
	 * @param overrides - Partial configuration from the component input.
	 * @returns A complete `HubNavConfig`.
	 */
	resolve(overrides: Partial<HubNavConfig>): HubNavConfig {
		return {
			...this.config(),
			...overrides
		};
	}
}
