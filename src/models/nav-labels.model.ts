/**
 * Localizable text used by the nav's built-in controls (toggler, mobile close,
 * panel navigation, section carets). Resolution order per label: instance
 * override via `HubNavConfig.labels`, then the shared `HUBUI.NAV.*` key from
 * `HubTranslationService` (ng-hub-ui-utils), then the English fallback.
 */
export interface HubNavLabels {
	/** Accessible label of the hamburger toggler button. */
	toggleNavigation: string;

	/** Accessible label of the mobile panel close button. */
	closeNavigation: string;

	/** Accessible label of the built-in rail toggle while the nav is expanded. */
	collapseNavigation: string;

	/** Accessible label of the built-in rail toggle while the rail is active. */
	expandNavigation: string;

	/** Accessible label of the drill-down panel back button. */
	goBack: string;

	/** Accessible label of the drill-down panel close button. */
	closePanel: string;

	/**
	 * Accessible label of a section caret. The `{label}` placeholder is
	 * replaced with the item's own label at render time.
	 */
	toggleSection: string;

	/**
	 * Accessible label of the pill that points to an active item scrolled out of view.
	 * The `{label}` placeholder is replaced with the active item's label.
	 */
	scrollToActive: string;
}

/** English fallbacks applied when neither config nor dictionary provide a label. */
export const HUB_NAV_DEFAULT_LABELS: HubNavLabels = {
	toggleNavigation: 'Toggle navigation',
	closeNavigation: 'Close navigation',
	collapseNavigation: 'Collapse navigation',
	expandNavigation: 'Expand navigation',
	goBack: 'Go back',
	closePanel: 'Close panel',
	toggleSection: 'Toggle {label}',
	scrollToActive: 'Scroll to {label}'
};

/** Shared-dictionary key for each label, under the reserved `HUBUI` namespace. */
export const HUB_NAV_LABEL_KEYS: Record<keyof HubNavLabels, string> = {
	toggleNavigation: 'HUBUI.NAV.TOGGLE_NAVIGATION',
	closeNavigation: 'HUBUI.NAV.CLOSE_NAVIGATION',
	collapseNavigation: 'HUBUI.NAV.COLLAPSE_NAVIGATION',
	expandNavigation: 'HUBUI.NAV.EXPAND_NAVIGATION',
	goBack: 'HUBUI.NAV.GO_BACK',
	closePanel: 'HUBUI.NAV.CLOSE_PANEL',
	toggleSection: 'HUBUI.NAV.TOGGLE_SECTION',
	scrollToActive: 'HUBUI.NAV.SCROLL_TO_ACTIVE'
};
