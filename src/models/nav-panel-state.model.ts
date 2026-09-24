import { HubNavItem } from './nav-item.model';

/**
 * Represents a single entry in the drill-down history stack of a panel.
 */
export interface HubNavPanelHistoryEntry {
	/** The items that were displayed before the drill-down. */
	items: HubNavItem[];

	/**
	 * The item those entries belonged to, restored verbatim when the reader goes back.
	 *
	 * It used to hold the label alone, so going back left the panel claiming a parent it was
	 * not showing: the id stayed on the item drilled *into* while the entries were its
	 * parent's. Anything that matches a panel to the menu by that id — reopening the same
	 * section, re-reading a panel after the `items` input changed — was answering about the
	 * wrong level.
	 */
	parentItem: HubNavItem;
}

/**
 * Represents the state of a single panel in the stacked panel navigation.
 */
export interface HubNavPanelState {
	/** Unique identifier for this panel instance. */
	id: string;

	/** The parent item that triggered opening this panel. */
	parentItem: HubNavItem;

	/** The items currently displayed in this panel. */
	items: HubNavItem[];

	/** History stack for drill-down navigation within this panel. */
	history: HubNavPanelHistoryEntry[];

	/** Whether this panel is currently in drill-down mode (has history entries). */
	isDrillDown: boolean;
}
