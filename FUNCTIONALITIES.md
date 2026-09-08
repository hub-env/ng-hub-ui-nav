# Functionalities of Nav Library

This table details the functionalities of the `ng-hub-ui-nav` library and indicates which ones are covered by interactive examples.

The public surface is one root component, `hub-nav`, the child components it renders (`hub-nav-item`, `hub-nav-item-list`, `hub-nav-panel`, `hub-nav-panel-container`, `hub-nav-separator`), five directives, and the configuration and state services.

## Component (`hub-nav`)

| Category | Functionality | Example Covered |
| :--- | :--- | :---: |
| **Data** | Navigation tree (`items`) | ✅ |
| | `link` item type | ✅ |
| | `dropdown` item type | ✅ |
| | `header` item type | ✅ |
| | `separator` item type | ✅ |
| | `custom` item type | ❌ |
| | Unlimited nesting through `children` | ✅ |
| | Item icon (`icon`) | ✅ |
| | Item badge (`badge` / `badgeClass`) | ✅ |
| | Disabled item (`disabled`) | ✅ |
| | Per-item class (`cssClass`) | ❌ |
| | Arbitrary payload (`data`) | ❌ |
| **Layout** | Horizontal orientation | ✅ |
| | Vertical orientation | ✅ |
| | `accordion` vertical expand mode (`verticalExpandMode`) | ✅ |
| | `flyout` vertical expand mode | ✅ |
| | `panel` drill-down expand mode | ✅ |
| | Per-item `expandMode` override | ✅ |
| | Sidebar side (`sidebarSide`) | ✅ |
| | Panel width and max visible panels (`panelWidth` / `panelMaxVisible`) | ✅ |
| | Sticky positioning (`position` / `stickyTop`) | ✅ |
| | Extra class on the inner `<nav>` (`navClass`) | ❌ |
| **Responsive** | Collapse breakpoint (`collapseBreakpoint`) | ✅ |
| | `offcanvas` collapse mode (`collapseMode`) | ✅ |
| | `dropdown` collapse mode | ✅ |
| | `fullscreen` collapse mode | ✅ |
| | Offcanvas slide-in side (`offcanvasPosition`) | ❌ |
| | Panel mode degrades to accordion while collapsed | ✅ |
| | Drawer forwards the item template and the start/end slots | ✅ |
| **Icon rail** | Two-way `rail` model | ✅ |
| | Built-in edge toggle (`railToggle`) | ✅ |
| | Labels as tooltips while railed | ✅ |
| | Accordion groups open as overlay flyouts while railed | ✅ |
| **Dropdowns** | `hover` / `click` / `both` triggers (`dropdownTrigger`) | ✅ |
| | `inline` render mode (`dropdownRenderMode`) | ✅ |
| | `overlay` render mode (body-level, avoids clipping) | ✅ |
| **Router** | `routerLink` with `route`, `queryParams` and `fragment` | ✅ |
| | Active on the item's own route and on anything below it | ✅ |
| | Strict matching (`routerLinkActiveOptions: { exact: true }`) | ✅ |
| | Travelling active mark (`activeIndicator`) | ✅ |
| | Following replaced URLs (`followReplacedUrls`, boolean or debounce in ms) | ✅ |
| | Opening dropdowns and panels from the route (`autoOpenFromRoute`) | ❌ |
| | One open section at a time when roots expand differently | ❌ |
| **Slots & templates** | `hubNavStart` / `hubNavEnd` projected slots | ✅ |
| | `inDrawer` slot context flag | ❌ |
| | `hubNavItemTemplate` directive | ✅ |
| | `itemTemplate` input | ❌ |
| **Outputs** | `itemClick` | ✅ |
| | `dropdownOpen` / `dropdownClose` | ✅ |
| | `mobileToggle` | ✅ |
| | `panelChange` (`open` / `close` / `drill-down` / `drill-back`) | ✅ |
| | `railChange` | ✅ |
| **Accessibility** | WAI-ARIA menubar/menu pattern with `aria-orientation` | ✅ |
| | Keyboard navigation (arrows, Home/End, Escape, ArrowLeft in panels) | ✅ |
| | Focus management on panel open and close | ✅ |
| | Accessible name of the `<nav>` (`ariaLabel`) | ❌ |
| | Truncated labels keep their full accessible name | ✅ |
| | RTL layout | ✅ |
| | `prefers-reduced-motion` fallbacks | ❌ |

## Directives

| Category | Functionality | Example Covered |
| :--- | :--- | :---: |
| **Slots** | `hubNavStart` | ✅ |
| | `hubNavEnd` | ✅ |
| | `hubNavItemTemplate` | ✅ |
| **Scroll spy** | `hubNavScrollSpy` container (`enabled`, `offset`, `sectionSelector`) | ❌ |
| | `hubNavScrollSpySection` marker, bare or with an explicit id | ❌ |
| | `activeSectionChange` output | ❌ |
| | Inert outside the browser (SSR/prerender) | ❌ |

## Configuration

| Category | Functionality | Example Covered |
| :--- | :--- | :---: |
| **Per instance** | `config` input merged over the global defaults | ✅ |
| **Global** | `HUB_NAV_CONFIG` injection token | ❌ |
| | `HubNavConfigService` (`getConfig`, `updateConfig`, defaults) | ❌ |
| **Labels** | Per-instance overrides (`config.labels`) | ❌ |
| | Shared `HUBUI.NAV.*` dictionary keys via `ng-hub-ui-utils` | ❌ |
| | English fallbacks (`HUB_NAV_DEFAULT_LABELS`) | ✅ |

## Styling

| Category | Functionality | Example Covered |
| :--- | :--- | :---: |
| **Accent** | `color` input (semantic name, registered accent or literal colour) | ❌ |
| | `--hub-nav-accent` single recolour hook | ✅ |
| | Derived roles `--hub-nav-accent-subtle` / `-emphasis` / `-on` | ❌ |
| **Tokens** | Surface (`--hub-nav-bg`, `--hub-nav-bg-image`, `--hub-nav-border-*`, `--hub-nav-box-shadow`) | ❌ |
| | Items (`--hub-nav-item-*`) | ✅ |
| | Dropdowns (`--hub-nav-dropdown-*`) | ❌ |
| | Panels (`--hub-nav-panel-width`) | ✅ |
| | Terminal panel shadow (`--hub-nav-panel-last-shadow`) | ❌ |
| | Rail and rail toggle (`--hub-nav-rail-*`) | ✅ |
| | Mobile drawer (`--hub-nav-mobile-*`) | ✅ |
| **SCSS** | `hub-nav-theme(...)` mixin, from `ng-hub-ui-nav/styles` | ✅ |

## Legend

- ✅ Covered by an interactive example on the documentation site.
- ❌ Supported by the library but not yet demonstrated by an example.
