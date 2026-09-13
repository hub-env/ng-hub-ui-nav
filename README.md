# ng-hub-ui-nav

[Español](./README.es.md) | **English**

[![npm version](https://img.shields.io/npm/v/ng-hub-ui-nav.svg)](https://www.npmjs.com/package/ng-hub-ui-nav)
[![license](https://img.shields.io/npm/l/ng-hub-ui-nav.svg)](https://github.com/carlos-morcillo/ng-hub-ui-nav/blob/main/LICENSE)

A flexible, accessible, and highly customizable navigation component for Angular 21+. It supports horizontal menus, vertical sidebars, mobile collapse modes, stacked drill-down panels, projected start/end slots, and scroll-spy integration.

> [!IMPORTANT]
> Version `22.14.1` targets Angular 22 and follows the signal-first architecture used across `ng-hub-ui`.

## Documentation and Live Examples

This package is part of [Hub UI](https://hubui.dev/en/), a collection of Angular component libraries for standalone apps.

- Docs: https://hubui.dev/en/nav/overview/
- Live examples: https://hubui.dev/en/nav/examples/
- Hub UI: https://hubui.dev/en/

## 🧩 Library Family `ng-hub-ui`

This library is part of the **ng-hub-ui** ecosystem:

- [**ng-hub-ui-accordion**](https://www.npmjs.com/package/ng-hub-ui-accordion) (deprecated — use ng-hub-ui-panels)
- [**ng-hub-ui-action-sheet**](https://www.npmjs.com/package/ng-hub-ui-action-sheet)
- [**ng-hub-ui-avatar**](https://www.npmjs.com/package/ng-hub-ui-avatar)
- [**ng-hub-ui-board**](https://www.npmjs.com/package/ng-hub-ui-board)
- [**ng-hub-ui-breadcrumbs**](https://www.npmjs.com/package/ng-hub-ui-breadcrumbs)
- [**ng-hub-ui-calendar**](https://www.npmjs.com/package/ng-hub-ui-calendar)
- [**ng-hub-ui-dropdown**](https://www.npmjs.com/package/ng-hub-ui-dropdown)
- [**ng-hub-ui-ds**](https://www.npmjs.com/package/ng-hub-ui-ds)
- [**ng-hub-ui-forms**](https://www.npmjs.com/package/ng-hub-ui-forms)
- [**ng-hub-ui-history**](https://www.npmjs.com/package/ng-hub-ui-history)
- [**ng-hub-ui-milestones**](https://www.npmjs.com/package/ng-hub-ui-milestones)
- [**ng-hub-ui-modal**](https://www.npmjs.com/package/ng-hub-ui-modal)
- [**ng-hub-ui-nav**](https://www.npmjs.com/package/ng-hub-ui-nav) ← You are here
- [**ng-hub-ui-paginable**](https://www.npmjs.com/package/ng-hub-ui-paginable)
- [**ng-hub-ui-panels**](https://www.npmjs.com/package/ng-hub-ui-panels)
- [**ng-hub-ui-portal**](https://www.npmjs.com/package/ng-hub-ui-portal)
- [**ng-hub-ui-skeleton**](https://www.npmjs.com/package/ng-hub-ui-skeleton)
- [**ng-hub-ui-sortable**](https://www.npmjs.com/package/ng-hub-ui-sortable)
- [**ng-hub-ui-stepper**](https://www.npmjs.com/package/ng-hub-ui-stepper)
- [**ng-hub-ui-utils**](https://www.npmjs.com/package/ng-hub-ui-utils)

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Examples](#examples)
- [API Reference](#api-reference)
- [Styling](#styling)
- [Changelog](#changelog)
- [Contribution](#contribution)
- [Support](#support)
- [Contributors](#contributors)
- [License](#license)

## Features

- Horizontal and vertical navigation layouts.
- Responsive collapse modes: `offcanvas`, `dropdown`, and `fullscreen`.
- Vertical child expansion modes: `accordion`, `flyout`, and `panel`.
- Stacked panel drill-down navigation with configurable visible panel count.
- Projected `hubNavStart` and `hubNavEnd` slots.
- Custom item rendering with `hubNavItemTemplate`.
- Router-aware active states with fragment and query param support.
- Scroll-spy helpers for documentation pages and one-page layouts.
- Sticky vertical navigation support.
- **Desktop icon rail** — the two-way `rail` input collapses a vertical nav to `--hub-nav-rail-width` (4rem) showing icons only: labels surface as tooltips, accordion groups open as click-triggered overlay flyouts, and the offcanvas behavior still wins below `collapseBreakpoint`. A built-in edge toggle ships by default (`config.railToggle: false` to bring your own) and is fully themeable through `--hub-nav-rail-toggle-*`, including a replaceable SVG arrow. The library persists nothing; `railChange` lets the app store the preference.
- **Tooltip on truncated labels** — long item labels are clipped with an ellipsis (the standard sidebar behaviour) and reveal their full text on hover, automatically and only when truncated (via `ng-hub-ui-utils`' `[hubOverflowTooltip]`). The tooltip is **agnostic** — it defaults to the hub-ui tooltip but is swappable with `provideHubTooltip(...)`. Requires `ng-hub-ui-utils >= 22.13.0` (the library's peer floor) and the tooltip styles (`@use 'ng-hub-ui-utils/styles/tooltip';`). Tip: control the sidebar width with `--hub-nav-panel-width`.
- Semantic `color` accent system (`primary` / `success` / `danger` / `warning` / `info`, plus any custom accent or literal colour) recolouring the hover/active affordances — mirrors `<hub-panels>`.
- Full CSS variable theming via `--hub-nav-*` tokens.

## Installation

```bash
npm install ng-hub-ui-nav
```

## Quick Start

```typescript
import { Component } from '@angular/core';
import { HubNavComponent, HubNavItem } from 'ng-hub-ui-nav';

@Component({
	standalone: true,
	imports: [HubNavComponent],
	template: `
		<hub-nav
			[items]="items"
			[config]="{
				orientation: 'horizontal',
				dropdownTrigger: 'click'
			}"
		/>
	`
})
export class ExampleComponent {
	readonly items: HubNavItem[] = [
		{ id: 'home', label: 'Home', type: 'link', route: '/' },
		{
			id: 'components',
			label: 'Components',
			type: 'dropdown',
			children: [
				{ id: 'accordion', label: 'Accordion', type: 'link', route: '/accordion' },
				{ id: 'calendar', label: 'Calendar', type: 'link', route: '/calendar' }
			]
		}
	];
}
```

## Examples

### Vertical Sidebar with Panels

```html
<hub-nav
	[items]="items"
	[config]="{
		orientation: 'vertical',
		verticalExpandMode: 'panel',
		panelMaxVisible: 2,
		panelWidth: '18rem',
		position: 'sticky',
		stickyTop: '1rem'
	}"
/>
```

### Start and End Slots

```html
<hub-nav [items]="items" [config]="{ orientation: 'horizontal' }">
	<ng-template hubNavStart let-collapsed="collapsed">
		<strong>My App</strong>
	</ng-template>

	<ng-template hubNavEnd>
		<button type="button">Profile</button>
	</ng-template>
</hub-nav>
```

### Scroll Spy

```html
<section
	hubNavScrollSpy
	(activeSectionChange)="activeSection = $event"
>
	<section id="overview" hubNavScrollSpySection>...</section>
	<section id="api" hubNavScrollSpySection>...</section>
</section>
```

### Collapsed Icon Rail

```html
<hub-nav
	[items]="items"
	[(rail)]="rail"
	[config]="{ orientation: 'vertical', verticalExpandMode: 'accordion' }"
>
	<!-- The slot context exposes the rail state, e.g. to swap the logo for a mark -->
	<ng-template hubNavStart let-rail="rail">
		<span class="brand">{{ rail ? 'A' : 'Acme ERP' }}</span>
	</ng-template>
</hub-nav>
```

A toggle button ships on the outer edge of the primary column: an arrow inside a container, fully driven by the `--hub-nav-rail-toggle-*` tokens (size, padding, border, radius, colors, shadow, offsets and the arrow glyph itself via the `--hub-nav-rail-toggle-icon` SVG mask). Set `config.railToggle: false` to hide it and drive `[(rail)]` from your own control. While the rail is active the nav host width is `--hub-nav-rail-width` (4rem by default), labels keep their accessible name and appear as tooltips, and groups open as overlay flyouts on click. Below `collapseBreakpoint` the flag is ignored — mobile keeps the offcanvas. `railChange` reports every flip (built-in toggle included) so the app can persist the preference.

## API Reference

### `HubNavComponent`

#### Inputs

| Input | Type | Default | Description |
|---|---|---|---|
| `items` | `HubNavItem[]` | required | Navigation tree to render. |
| `config` | `Partial<HubNavConfig>` | `{}` | Per-instance config merged with global defaults. |
| `navClass` | `string` | `''` | Additional class applied to the internal `<nav>`. |
| `itemTemplate` | `TemplateRef<unknown> \| null` | `null` | Optional custom item template. |
| `autoOpenFromRoute` | `boolean` | `false` | Opens matching dropdowns/panels from the current route, and leaves exactly one section open when roots expand differently: arriving at an accordion root drops the panel of the panel root you left, and the other way round. It also re-derives the stack when the viewport comes back above `collapseBreakpoint`; with the input off, a stack opened by hand survives that round trip. |
| `rail` | `boolean` (two-way `model`) | `false` | Desktop-only icon rail for vertical navs. Ignored below `collapseBreakpoint`. Bind with `[(rail)]`. |
| `color` | `'primary' \| 'success' \| 'danger' \| 'warning' \| 'info' \| string \| undefined` | `undefined` (reads as `primary`) | Semantic accent for the hover/active affordances. A bareword — semantic name, registered accent or CSS named colour — resolves through `--hub-sys-color-<name>`; a literal `#hex` / `rgb()` / `oklch()` / `var()` is passed through unchanged. |

#### Outputs

| Output | Type | Description |
|---|---|---|
| `itemClick` | `OutputEmitterRef<HubNavItem>` | Emitted when a link item is activated. |
| `dropdownOpen` | `OutputEmitterRef<HubNavItem>` | Emitted when a dropdown opens. |
| `dropdownClose` | `OutputEmitterRef<HubNavItem>` | Emitted when a dropdown closes. |
| `mobileToggle` | `OutputEmitterRef<boolean>` | Emitted when the responsive mobile panel opens or closes. |
| `panelChange` | `OutputEmitterRef<HubNavPanelEvent>` | Emitted when a panel opens, closes, drills down, or drills back. |
| `railChange` | `OutputEmitterRef<boolean>` | Emitted when the rail model flips — persist it app-side to restore the rail on boot. |

### `HubNavConfig`

```typescript
interface HubNavConfig {
	orientation: 'horizontal' | 'vertical';
	verticalExpandMode: 'accordion' | 'flyout' | 'panel';
	dropdownTrigger: 'hover' | 'click' | 'both';
	position: 'static' | 'sticky' | 'fixed';
	stickyTop: string;
	collapseMode: 'offcanvas' | 'dropdown' | 'fullscreen';
	collapseBreakpoint: number;
	offcanvasPosition: 'start' | 'end' | 'top' | 'bottom';
	ariaLabel: string;
	panelMaxVisible: number;
	sidebarSide: 'left' | 'right';
	panelWidth: string;
	dropdownRenderMode: 'inline' | 'overlay';
	railToggle?: boolean;
	activeIndicator?: boolean;
	followReplacedUrls?: boolean | number;
	labels?: Partial<HubNavLabels>;
}
```

`railToggle` (default `true`) draws the built-in rail toggle on the outer edge of a vertical desktop nav; set it to `false` to supply your own control.

`activeIndicator` (default `false`) moves the active mark to a single element shared by the list so it travels between siblings instead of appearing in place. It is opt-in because the mark stops being painted by each item, so a rule targeting `.hub-nav-item__link--active` no longer applies. It honours `prefers-reduced-motion`.

`followReplacedUrls` (default `true`) decides how eagerly the nav follows a URL that was **replaced** rather than pushed — which is what a scroll spy does while the reader scrolls. `true` follows every report; a **number** follows only once the reports have been quiet for that many milliseconds, so the mark lands where the reader stopped instead of walking down the menu; `false` never follows, marking only where the reader chose to go. Deep links are unaffected either way.

`labels` overrides the built-in accessible strings (`toggleNavigation`, `closeNavigation`, `collapseNavigation`, `expandNavigation`, `goBack`, `closePanel`, `toggleSection` — the last one supports a `{label}` placeholder) per instance. Without an override, each label resolves from the shared `HUBUI.NAV.*` dictionary keys (`provideHubTranslationAdapter()` in `ng-hub-ui-utils`) and finally falls back to English.


### `HubNavItem`

```typescript
interface HubNavItem {
	id: string;
	label: string;
	type: 'link' | 'dropdown' | 'header' | 'separator' | 'custom';
	icon?: string;
	route?: string | string[];
	queryParams?: Record<string, string>;
	fragment?: string;
	routerLinkActiveOptions?: { exact: boolean };
	children?: HubNavItem[];
	badge?: string;
	badgeClass?: string;
	disabled?: boolean;
	cssClass?: string;
	data?: unknown;
	expandMode?: 'accordion' | 'flyout' | 'panel';
}
```

#### Active-route matching

An item is active on its own route **and on anything below it**, so opening a
record keeps its section marked: `/customers` stays active at
`/customers/42/edit`. Matching is by whole segments — `/products` is not marked
by `/products-archive` — and the query string is ignored. A root item (`/`)
matches only itself instead of claiming every page, and a dropdown follows its
children, so a section stays legible while its entries are collapsed.

When one item's route sits under another's, only the most specific one is
marked: at `/products/categories` the catalogue entry is marked and
`/products` is not, while at `/products/42/edit` the list keeps its mark
because nothing more specific matches.

Set `routerLinkActiveOptions: { exact: true }` on an item that should only be
marked on its exact route:

```typescript
{ id: 'home', label: 'Home', type: 'link', route: '/', routerLinkActiveOptions: { exact: true } }
```

### Directives

- `hubNavStart`: projects content into the start slot.
- `hubNavEnd`: projects content into the end slot.
- `hubNavItemTemplate`: overrides item rendering.
- `hubNavScrollSpy`: tracks visible sections in a scroll container.
- `hubNavScrollSpySection`: marks a section as spy-trackable.

## Styling

The component exposes a complete set of `--hub-nav-*` tokens. See the full reference in:

- [CSS Variables Reference](docs/css-variables-reference.md)

### Recolour the whole nav from a single accent

The hover/active affordances and the nav surface all derive from one accent hook. Set it (or use the `color` input) to re-theme the entire nav:

```css
.my-sidebar {
	--hub-nav-panel-width: 18rem;
	/* Single recolour hook — the tinted active background, accent text, hover
	   tint, indicator bar, and surface wash all follow this one accent. */
	--hub-nav-accent: var(--hub-sys-color-success);
	--hub-nav-dropdown-shadow: 0 0.75rem 1.5rem rgba(0, 0, 0, 0.16);
}
```

### Paint the bar with a gradient

The fill is a colour and an image on two separate properties, so a gradient goes on
`--hub-nav-bg-image` and never on `--hub-nav-bg`. That is not a style preference: a gradient is an
`<image>`, so a `var()` holding one substituted into `background-color` computes to an invalid
value and the whole declaration is dropped — the bar would come out with no fill at all rather than
falling back to the colour. Kept apart, `--hub-nav-bg` stays underneath as the fallback.

```css
.my-sidebar {
	--hub-nav-bg: #4c1d95;
	--hub-nav-bg-image: linear-gradient(180deg, #6d28d9, #4c1d95);
}
```

### Restore the legacy solid-fill look

The default active item is now a soft accent tint + accent text. To restore the previous solid accent fill + white text (the pre-`22.1.0` look), override these tokens explicitly:

```css
.my-sidebar {
	--hub-nav-item-active-bg: #0d6efd;
	--hub-nav-item-active-color: #ffffff;
	--hub-nav-item-hover-bg: rgba(0, 0, 0, 0.04);
	--hub-nav-bg: #ffffff;
}
```

## Changelog

See the full release history in [CHANGELOG.md](CHANGELOG.md).

If you are upgrading across versions, also review [BREAKING_CHANGES.md](BREAKING_CHANGES.md).

## Contribution

Issues, discussions, and pull requests are welcome.

If you want to contribute:

1. Fork the repository.
2. Create a feature branch.
3. Keep API changes documented in the README and changelog.
4. Open a pull request with a clear description of the change.

## Support

If this library helps your projects, you can support its maintenance here:

- [Buy Me a Coffee](https://buymeacoffee.com/carlosmorcillo)

## Contributors

Created and maintained by [Carlos Morcillo](https://www.carlosmorcillo.com).

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
