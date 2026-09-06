# Breaking Changes - ng-hub-ui-nav

This document tracks breaking changes in the `ng-hub-ui-nav` library.

## Version 22.8.0

### Items stay active on descendant routes (behavioural change)

- **Change**: an item used to be active only on its exact route. It is now active on its own route **and on anything below it**, matched by whole segments and ignoring the query string — `/customers` stays marked at `/customers/42/edit`. A root item (`/`) still matches only itself, and `routerLinkActiveOptions: { exact: true }` — declared in `HubNavItem` but never read until now — opts an item back into strict matching.
- **Impact**: no API changed and existing code keeps compiling, but more items can read as active than before. A nav that leaned on the old strictness — typically a flat list of sibling sections where one route prefixes another as a real segment — now marks the parent on detail pages. Consumers who already declared `routerLinkActiveOptions: { exact: true }` see that option honoured for the first time, which is a change in itself.
- **Restore the previous behaviour**: set the option explicitly on the items that must not follow their children.

    ```ts
    { id: 'customers', label: 'Customers', type: 'link', route: '/customers', routerLinkActiveOptions: { exact: true } }
    ```

## Version 22.7.0

### The accent input `variant` is renamed to `color`

- **Change**: the semantic accent input of `<hub-nav>` is now called `color`, matching the rest of the hub-ui family (`<hub-button>`, `<hub-badge>`, `<hub-metrics>`, `<hub-milestone>`). Its accepted values are unchanged — a semantic name, a registered accent, a CSS named colour, or a literal `#hex` / `rgb()` / `oklch()` / `var()` — and so is the internal `data-variant` attribute together with the `:host([data-variant='…'])` token rules, so no stylesheet override has to move.
- **Impact**: `variant` no longer exists. A template that still binds it fails to compile, and one that sets it as a static attribute compiles but is ignored, leaving the nav on the `primary` accent with nothing to explain why.
- **Migration**: rename the binding.

    ```html
    <!-- before -->
    <hub-nav [items]="items" variant="success" />
    <!-- after -->
    <hub-nav [items]="items" color="success" />
    ```

## Version 22.2.0

### Canonical `zindex` token names

- **Change**: the three z-index tokens dropped the hyphen inside `z-index`, to match the `--hub-sys-zindex-*` convention used across the design system: `--hub-nav-dropdown-z-index` → `--hub-nav-dropdown-zindex`, `--hub-nav-mobile-z-index` → `--hub-nav-mobile-zindex`, `--hub-nav-panel-z-index` → `--hub-nav-panel-zindex`.
- **Impact**: an override written against an old name is not an error anywhere — CSS custom properties never are — it simply stops arriving, so a dropdown or an offcanvas that was deliberately stacked above (or below) some other layer silently returns to the library default.
- **Migration**: rename the custom properties wherever they are set.

    ```css
    .my-nav {
    	/* before: --hub-nav-dropdown-z-index: 2000; */
    	--hub-nav-dropdown-zindex: 2000;
    }
    ```

## Version 22.1.0

### New default active/hover/surface appearance (visual breaking)

- **Change**: The default visual treatment of the nav was reworked to read as a soft, accent-themed surface rather than a high-contrast solid bar:
    - The **active item** moved from a solid accent fill + white text (`--hub-nav-item-active-bg: #0d6efd; --hub-nav-item-active-color: #fff;`) to a **soft accent tint background + accent-coloured text**. In a **horizontal** navbar the active item additionally gains an accent **indicator bar** along its bottom edge (a tabs-style underline); vertical/sidebar navs are signalled by the tint + accent text alone (no inline-start bar).
    - The **hover background** moved from a neutral grey overlay to a **soft accent tint**.
    - The **nav surface** (`--hub-nav-bg`) moved from pure white to a **faint wash of the accent** (`color-mix(accent 5%, surface)`), so each accent reads as a distinctly-themed surface.
- **Impact**: This is a purely **visual** breaking change — no API, markup, or input was removed or renamed; existing code keeps compiling. However, the rendered appearance changes for every consumer that relied on the previous solid-fill look.
- **Accessibility note**: The active item now relies on a **tinted background + accent text** rather than a solid fill with white text. The accent-on-tint pairing is lighter-contrast than the previous white-on-solid pairing. If your design requires a guaranteed high-contrast active state (e.g. for WCAG AA on a busy background), restore the legacy solid fill via the recipe below, or supply an accent whose tint/text pairing meets your contrast target.
- **Restore the previous look**: Override the four tokens at component, page, or theme level to reinstate the v22 solid-fill appearance:

    ```css
    .my-nav {
    	/* Active item: solid accent fill + white text (legacy look) */
    	--hub-nav-item-active-bg: #0d6efd;
    	--hub-nav-item-active-color: #ffffff;
    	/* Hover: neutral grey overlay (legacy look) */
    	--hub-nav-item-hover-bg: rgba(0, 0, 0, 0.04);
    	/* Nav surface: pure white (legacy look) */
    	--hub-nav-bg: #ffffff;
    }
    ```

    The horizontal active indicator bar inherits `--hub-nav-item-active-indicator-color` (the accent) and is harmless over a solid fill; set `--hub-nav-item-active-indicator-size: 0` if you want it gone.

## Version 21.1.0

No breaking changes were introduced in this release.

## Version 21.0.0

### Angular 21 alignment

- **Change**: The library major version aligns with Angular 21.
- **Impact**: Consumers should use Angular 21 or newer when adopting `ng-hub-ui-nav` 21.x releases.
