# Breaking Changes - ng-hub-ui-nav

This document tracks breaking changes in the `ng-hub-ui-nav` library.

## Version 22.17.0

### A hovered or active entry's label changes colour

- **Change**: `--hub-nav-item-hover-color` and `--hub-nav-item-active-color` read
  `--hub-nav-accent-emphasis` instead of the raw `--hub-nav-accent`, and that role is now the
  accent steered into the theme's emphasis window rather than a percentage mixed over the ink.

- **Why**: both labels are painted on a tint of the same accent, so the pair is composed, not
  declared — and the raw accent on its own 12% wash measured 3.88:1 for the default primary,
  under the 4.5:1 a label is owed. A percentage mix cannot darken a pale accent, which is why
  the old derivation could not fix it.

- **Impact**: the hover and active label of every accent darkens, built-in or custom. Hue and
  chroma are untouched, so a themed nav still reads as its own colour. Backgrounds, indicators
  and the on-accent flip do not move.

- **What happens if you do nothing**: nothing stops compiling, and those labels darken. A
  screenshot test of a hovered or active entry will differ.

- **Migration**: none. To keep the raw accent on the label — accepting that it may not reach
  4.5:1 on the tint behind it — point the slot back at it:

```css
hub-nav {
	--hub-nav-item-active-color: var(--hub-nav-accent);
}
```

### A vertical `hub-nav` no longer sets its own width to 100%

- **Change**: the component wrote `width: 100%` inline on its host for every vertical orientation.
  It writes nothing now, leaving the host at `width: auto`. The rail is the one exception and
  keeps its explicit `--hub-nav-rail-width`.
- **Impact**: in a block container nothing moves — a block-level box at `width: auto` already
  fills its container, and the `align-self: stretch` the component sets keeps it filling a flex
  column. What changes is every layout where the percentage was resolved against something other
  than the space meant for the sidebar: placed in a flex row or a grid track beside its content,
  the nav asked for the whole track and left the content nothing. Those layouts now get a sidebar
  the width of its own entries. A layout built around the old behaviour — a nav in a flex row
  that was expected to fill it — has to say so.
- **Migration**: give the nav the width you mean, on your side of the boundary.

    ```scss
    .app-shell__sidebar hub-nav {
        width: 16rem; // or flex: 0 0 16rem;
    }
    ```

### `HubNavPanelHistoryEntry.parentLabel` becomes `parentItem`

- **Change**: a drill-down history entry used to record the label of the level it came from. It
  records the whole entry now: `parentLabel: string` → `parentItem: HubNavItem`.
- **Impact**: only code that reads or builds `HubNavPanelState.history` by hand, which is internal
  state of an open panel rather than something a menu declares. It does not compile until it is
  changed, so nothing fails silently. The panel header still shows the same label, taken from
  `parentItem.label`.
- **Migration**: read the label off the item.

    ```ts
    const label = entry.parentItem.label; // was entry.parentLabel
    ```

  The reason for the change is behavioural: coming back out of a drill-down used to rebuild the
  parent as `{ ...drilledItem, label: previousLabel }`, so the panel's `parentItem.id` named the
  level it had just left rather than the one it was showing. Reopening that section, or matching
  the panel back to a menu that changed, was answering about the wrong level.

## Version 22.16.0

### `itemClick` fires for entries that carry no route (behavioural change)

- **Change**: the output used to be gated on `item.route`, so only routable entries were
  reported. It now fires for every entry the reader can press — a section anchor, a wizard step,
  anything whose click the application handles itself. Headers, separators and disabled items are
  unchanged: they never emitted and still do not.
- **Impact**: a handler that treated the payload as routable can now receive an item without a
  route. `this.router.navigate(item.route!)` was safe before and throws now, and a counter or an
  analytics call keyed on the output will see clicks it never saw. Nothing fails to compile: the
  payload type has not changed, because `route` was always optional.
- **Migration**: check before using the route.

    ```ts
    onItemClick(item: HubNavItem): void {
        if (!item.route) {
            return;
        }
        // …
    }
    ```

### `HubNavScrollSpyDirective.scrollTo` scrolls one container (behavioural change)

- **Change**: the jump used `scrollIntoView`, which moves every scrollable ancestor of the
  section. It now scrolls exactly one element — `scrollContainer` when you declare it, otherwise
  the nearest scrolling ancestor, otherwise the window — and subtracts `offset` so the section
  lands below a sticky header instead of behind it.
- **Impact**: a page whose section was reachable only by scrolling two nested containers at once
  now moves the inner one alone. Conversely, a layout that relied on the shell sliding to make
  room stops sliding. The `offset` compensation also changes where the jump lands, by exactly the
  value you already set for the observer.
- **Migration**: usually none. Declare the element you mean if the automatic choice is wrong:

    ```html
    <div #body class="page__body" hubNavScrollSpy [scrollContainer]="body">…</div>
    ```

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

## [22.15.0] - 2026-09-23

### Angular below 17.3.0 is no longer supported

- **Change**: the `@angular/*` peer ranges move from `>=17.2.0` to `>=17.3.0`.

- **Why**: Its published `.d.ts` names `InputSignalWithTransform` or `OutputEmitterRef`, which Angular did not ship until 17.3.

- **Impact — an application below 17.3.0 gets a peer warning where it used to get a build error.**
  Nothing that worked stops working: those versions never compiled against this package. Upgrade
  Angular to 17.3.0 or stay on the previous release.
