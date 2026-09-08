# Changelog

All notable changes to this project will be documented in this file.

## [22.12.1] - 2026-09-07

### Changed

- **The rail tooltip is drawn by `[hubTooltip]`.** A collapsed rail hides the item labels and
  puts each one in a tooltip; that tooltip came from `[tooltip]`, which `ng-hub-ui-utils` removes
  in 22.14.0 because a bare attribute is a name in the application's namespace rather than a
  library's. The prefixed directive is the same tooltip — both were thin shells over the same
  controller — so nothing about the rail changes, and this library keeps working with any
  `ng-hub-ui-utils` from 22.13.0 up.

## [22.12.0] - 2026-09-07

### Fixed

- **The flyout panel stayed hanging where its trigger had been.** In a menu that mixes the two
  expansions, opening a floating section closes the accordion above it and everything underneath
  rises to fill the gap, the trigger included. Neither of the two things the overlay watched — the
  page scrolling, the window resizing — happens there, so the panel kept the height the trigger had
  before the collapse and was left orphaned halfway down the menu, next to nothing in particular.
  The collapse is animated, so it is not a jump either: the trigger slides for the length of the
  transition and the panel now travels with it the whole way. Fixed in `ng-hub-ui-utils` 22.13.0,
  which is what this release requires.

- **A mixed menu left the panel of the section you had just walked out of on screen.** In a nav
  where one root drills down into panels and another expands in place, landing on the accordion
  root synchronised the dropdowns and left the panel stack alone — an accordion never touches that
  stack, so nothing ever closed it. The reader was shown two open sections at once, one of them the
  section they had just left. The mirror image was true too: landing on a panel root left the
  previous accordion expanded beside the new panel. Each root now clears whatever the other opened,
  while moving inside the root you are already in still leaves that section standing.

- **A first entry sitting on the language prefix swallowed every route match.** The active root was
  taken to be the first item matching the URL, and an item routed at `/en/` matches every page in
  the site, so in such a menu the section actually holding the route was never the one resolved:
  accordion sections stayed shut on every page, and their navigation was handed to the panel stack
  instead. The active root and the trail of open dropdowns now both resolve by the longest matching
  route — the rule the panel opener already followed.

- **A page outside the menu left the last section marked open.** Panels were cleared when no item
  matched the URL, the dropdowns were not, so the nav went on claiming the reader was inside a
  section they had left. Both are cleared now, and likewise when the route lands on a root with no
  children of its own.

### Changed

- `ng-hub-ui-utils` peer floor raised to `>=22.13.0`, which is where the overlay learned to follow a
  trigger that moves. Below it the flyout panel still parts company with its item, so the floor is
  the only thing that keeps the fix above from being a promise the installed packages cannot keep.
  Raising a floor is what forces this release to be a minor rather than the patch it started as:
  the fix itself changes no public shape in this library.

- `closeAllDropdowns()` and `closeAllPanels()` on `HubNavStateService` skip the write when there is
  nothing open. Route synchronisation calls both on every navigation, and a signal has no value
  equality: writing an empty set over an empty set woke every reader for nothing.

## [22.11.3] - 2026-09-06

### Added

- `FUNCTIONALITIES.md`, the coverage matrix nine sibling libraries already ship: what the library
  supports, and which parts a live example actually demonstrates.

### Fixed

- **A section marked the way the README teaches was never tracked.** `<section id="overview"
  hubNavScrollSpySection>` reaches the directive as the empty string, not as `null` — that is how
  Angular initialises a valueless static attribute — so the nullish fallback to the host `id` never
  ran, the host marker attribute was stripped, and the container's query found no sections at all.
  The spy stayed silent: no `activeSectionChange`, ever, with nothing in the console to explain it.

    Consumers who hit this had to bind the id twice, once as `id` and once as
  `[hubNavScrollSpySection]`, to get back the behaviour the directive already promised. The
  fallback is now falsy-aware, so the documented bare form works and the explicit form is unchanged.

- **The documentation described an API the library does not have.** Both READMEs tabulated a
  `variant` input — renamed to `color` back in 22.7.0 — so anyone copying the row got a compile
  error, and the only way to learn the real name was to open `projects/nav/src`. The same tables
  omitted three `HubNavConfig` options (`railToggle`, `activeIndicator`, `followReplacedUrls`) and
  two overridable labels (`collapseNavigation`, `expandNavigation`), and the version banner still
  announced `21.1.1`.

- **A breaking minor with no migration note.** The major here tracks Angular, so a breaking change
  can only ship as a minor and `BREAKING_CHANGES.md` is the only warning a consumer ever gets. Two
  never got one: the 22.7.0 `variant` → `color` rename and the 22.2.0 `z-index` token renames,
  which fail silently — a custom property that stops arriving is never an error, the override just
  stops applying.

- `verticalExpandMode` documented only `accordion` and `flyout` while the type has accepted
  `panel` since 21.1.0, so the drill-down mode was invisible to anyone reading the interface.

## [22.11.2] - 2026-09-02

### Fixed

- **A sidebar came back from mobile without its section panel.** Narrowing the window below
  `collapseBreakpoint` and widening it again left the nav expanded but panel-less: crossing back up
  emptied the panel stack, and nothing refilled it, because panels are derived from the route only
  on navigation. The user had to navigate somewhere else — anywhere — to get back the section they
  were already in.

    It reads as a layout collapse rather than as a missing panel, because applications lean on that
  panel being there: one that hides its own in-page index while the nav shows a panel unfolds a
  full-height menu the moment the panel disappears, pushing the page the reader had open below the
  fold.

    The stack is now re-derived from the current URL instead of being left empty. Not merely kept,
  because it can be stale: while collapsed the offcanvas menu navigates without touching the panels
  — they are not rendered in that mode — so what survived would describe the page the user left.
  When the route does not own the panels (`autoOpenFromRoute` off) the stack is whatever the user
  opened by hand and nothing could rebuild it, so it is now left untouched rather than discarded.

    Worth naming, because removing that unconditional close also removed an incidental cleanup: on a
    **mixed** nav, where roots carry their own `expandMode`, widening while the active root is in
    accordion mode leaves a panel from the previous panel-mode section rendered. That leak is not new
    — ordinary desktop navigation between a panel root and an accordion root already produces it,
    because the accordion branch returns before touching the stack — but the breakpoint round trip
    used to mask it and no longer does. Not fixed here: closing there changes what a mixed nav shows
    on every navigation, which is more than a patch should decide.
  Either way the narrow/widen round trip ends where it started.

## [22.11.1] - 2026-09-01

### Changed

- **The `homepage` in the manifest points at this library's own documentation page** rather than at
  the site root. It is the link a registry shows beside the package and the one a reader clicks from
  it, and landing on a front page they then have to search is a worse answer than landing on the
  reference for the package they were already looking at. Metadata only — no code, no types, no
  styles change, and nothing a consumer imports is affected.

## [22.11.0] - 2026-08-19

### Added

- **`isLast` on `<hub-nav-panel>`.** Marks the outermost panel of a vertical stack so it can close the stack's edge. The container sets it for you; it is public because `HubNavPanelComponent` is, and anyone composing panels by hand needs the same switch.
- **`--hub-nav-panel-last-shadow`** (default `none`). The shadow of that terminal panel. It is dropped by default because the panel now closes its edge with a border and the boundary should be drawn once — but "the border replaces the shadow" only holds for a theme that draws borders. One that separates its panels by shade, or by a cast shadow, sets this; `var(--hub-nav-panel-shadow)` keeps the panel's own.

### Fixed

- **The final panel of a vertical stack now closes its outer edge with a real border.** The library previously only drew each panel's leading divider and relied on a shadow for the terminal edge. Themes that remove or soften shadows therefore left the navigation visually open and could blend it with adjacent page chrome. The terminal panel now owns the matching border itself on both left and right sidebars.

    The border sides are **physical**, not logical, and that is the second thing this fixes. The side a sidebar sits on is a layout decision — a nav configured to the right stays on the right when the document turns RTL — while a logical property turns with the text. Under RTL the closing border therefore landed on the sidebar's *inner* edge: measured at 0px outside and 1px inside. All four combinations of direction and side now put it on the outside.

    And the terminal panel drops its shadow through `--hub-nav-panel-last-shadow` (default `none`) rather than being written off. "The border replaces the shadow" only holds for a theme that draws borders; one that separates its panels by shade or by a cast shadow was left with neither, and the shared `--hub-nav-panel-shadow` could not reach past this more specific rule. Set it to `var(--hub-nav-panel-shadow)` to keep the panel's own.

    The two rules that place that border by context — the right-hand sidebar, where the outer edge is the start side, and a horizontal nav, where there is no vertical stack to close — are written as `:host-context(A).class` rather than `:host-context(A):host(.class)`. The second form reads naturally and cannot work: Angular's shim collapses it into a single compound, `A.class[_nghost]`, which asks one element to carry both a class of the container and a class of the panel. It matches nothing, silently, so a right sidebar would close its border on the inner edge and a horizontal nav would draw one it should not have. A case in the panel's bench now pins the descendant form.

## [22.10.0] - 2026-08-16

### Fixed

- **The scroll spy could never reach the last sections of a page.** Its observation band stops partway down the viewport, so once the container has nothing left to scroll, everything below that line is unreachable — those sections could not be reported however long the reader stared at them. Clicking the final entry of a seven-example page settled the mark four items above it. The last section now wins outright once the container is at its end.

- **A short section outranked the tall one the reader was actually in.** Selection went by `intersectionRatio`, which measures how much of a section fits the band rather than which one comes first, so a small block sitting entirely inside it beat a long one scrolling through — and the mark bounced between them. The topmost section in the band wins now.

### Added

- **`config.followReplacedUrls` — how eagerly the nav follows a scroll spy.** A spy names the section under the reader by REPLACING the URL as they scroll, and following every one of those steps the highlight down a long menu two or three times a second while they are doing nothing but read: measured on a thirty-item panel, twenty changes in six seconds. The option takes `true` (follow each report, the previous and default behaviour), a **number** of milliseconds (follow only once the reports go quiet, so a scroll lands the mark once where the reader stopped) or `false` (never follow; the nav marks only where they chose to go). On the same panel, a 400ms setting turns those twenty changes into one. Deep links are unaffected in every case.

- **`config.activeIndicator` — the active mark can travel between items** instead of appearing and disappearing in place (off by default). One element per list, parked over whichever sibling is active and moved with a `transform`, so the animation never touches the layout. Duration and easing come from the new `--hub-nav-item-active-indicator-transition`; the surface and the underline keep the tokens they already had, and the item keeps its accent colour and weight — what travels is the surface, not the emphasis.

    Opt-in rather than default because the mark is normally painted by each item: turning it on moves the same pixels to a node the list owns, so an application that had restyled `.hub-nav-item__link--active` would see its rule stop applying.

    Travelling says "you chose to go here", so it is reserved for that. A report — a replaced URL, or a relayout such as the rail collapsing or an accordion opening above — moves the mark without animating it: neither is a decision. Travel also only means something between siblings, along an edge they share; crossing into a submenu, a drill-down panel or a collapsed rail exchanges one list for another, so each list owns its own mark. The geometry is measured rather than derived — items size themselves from their content, and the rail, the accordion and the viewport all resize them without the list ever hearing about it — and re-measured through a `ResizeObserver` for that reason. Honours `prefers-reduced-motion`.

## [22.9.1] - 2026-08-16

### Fixed

- **An item stopped being marked active when the application serialized URLs with a trailing slash.** `/products` and `/products/` are the same place, and an application decides which one reaches the address bar — a canonical trailing-slash `UrlSerializer` is an ordinary SEO choice. Route matching compared the two as raw strings, so every item whose route was declared without the slash silently stopped matching. Only ancestors stayed lit, because their prefix test happens to tolerate one, which made the failure look like "only the section marks, never the page".

    Worst on items that differ from their siblings only by `fragment`: none of them ever matched, so a scroll-spy panel appeared dead — the spy was writing the fragment on every scroll and nothing downstream agreed it had changed. Paths are now compared normalized, root excluded.

## [22.9.0] - 2026-08-15

### Added

- **Desktop icon rail.** The new two-way `rail` input (`[(rail)]`) collapses a vertical nav to `--hub-nav-rail-width` (4rem by default) showing icons only. A built-in toggle sits on the outer edge of the primary column (`config.railToggle`, default `true`; disable it to ship your own) rendered as an arrow inside a themeable container — every aspect resolves from the `--hub-nav-rail-toggle-*` tokens: size, padding, border, radius, colors, shadow, offsets, z-index, transition and the arrow itself (an SVG `mask-image` replaceable through `--hub-nav-rail-toggle-icon`). Labels keep their accessible name and surface as tooltips on hover; accordion groups open as click-triggered overlay flyouts; drill-down panels keep working beside the rail. Below `collapseBreakpoint` the flag is ignored and the offcanvas behavior always wins. The library persists nothing — `railChange` reports flips so the host app owns the toggle and storage. Start/end slot and item template contexts now expose a `rail` flag, and two tokens ship with it: `--hub-nav-rail-width` and `--hub-nav-rail-transition`.
- **Localizable built-in labels.** The previously hardcoded ARIA strings (`Toggle navigation`, `Close navigation`, `Go back`, `Close panel`, `Toggle <section>`, plus the new `Collapse navigation` / `Expand navigation` of the rail toggle) now resolve from the shared `HUBUI.NAV.*` dictionary keys (via `provideHubTranslationAdapter()` from `ng-hub-ui-utils`), with per-instance overrides through the new `HubNavConfig.labels` and English fallbacks. `TOGGLE_SECTION` supports a `{label}` placeholder.

### Changed

- `ng-hub-ui-utils` peer floor raised to `>=22.8.1`: the rail's overlay flyouts rely on the content-sized overlay clipping fix shipped there, and the shared translation adapter (`provideHubTranslationAdapter`) arrived in 22.8.0.

## [22.8.4] - 2026-08-13

### Fixed

- Route-aware panel sidebars now choose the most specific active root item when opening panels. A localized Home route such as `/en/` no longer wins over `/en/forms/overview/`, so deep links keep the active library's secondary panel open instead of leaving only its root entry highlighted.

## [22.8.3] - 2026-08-08

### Fixed

- Documentation links now point at the canonical localized URLs. The README linked to `https://hubui.dev/<path>` with no locale prefix and no trailing slash, and both forms are 301-redirected, so every reader arriving from npm or GitHub landed on a redirect instead of the canonical page.

## [22.8.2] - 2026-08-07

### Fixed

- **A section no longer blinks when you click inside it.** Clicking an entry closed every dropdown, which is what a flyout wants — it is a transient menu and the click is what dismisses it — but an accordion opened from the route is the opposite: its open section states where you are. Closing it and letting the route reopen it a tick later made the section shut and open again on every navigation, which arrived as a flicker the moment 22.8.1 taught the route to open accordions at all. The click now leaves the dropdown state alone when the route owns it (`autoOpenFromRoute` on an accordion) and still dismisses a flyout, as before.

## [22.8.1] - 2026-08-07

### Fixed

- **An accordion opens the section you navigated into.** Opening from the route was decided by whether the rail was collapsed, and nothing else: collapsed synced the dropdowns — which is what an accordion opens — while expanded opened a panel from the drill-down stack, a mechanism an accordion never renders. So a vertical accordion arrived at `/products` with its section shut, and the panel it had opened instead sat behind the page, present in the DOM and invisible to the eye and the pointer. The expanded rail now consults `getEffectiveExpandMode` for the section holding the active route, so an accordion syncs its dropdowns and only a flyout or panel rail opens panels.
- **Two entries no longer claim to be where you are.** Marking a section on everything below it — what keeps a detail page from clearing the rail — also marked an entry whose route prefixes a sibling's: at `/products/categories`, both "Products" (`/products`) and "Categories" lit up. The longest matching route among siblings wins now, so the catalogue is marked there and the list is still marked at `/products/42/edit`, where nothing more specific matches. An exact match is never overridden, and a dropdown that matched through a child keeps its mark — it is the section, not a competitor.

## [22.8.0] - 2026-08-06

### Fixed

- **The rail keeps its mark on a detail page.** An item was active only on its exact route, so opening a record — `/customers/42/edit` from `/customers` — cleared the mark and left no answer to "where am I". An item is now active on its own route **and on anything below it**, matched by whole segments (`/products` is not marked by `/products-archive`), with the query string ignored. A root item (`/`) still matches only itself rather than claiming every page, and `routerLinkActiveOptions: { exact: true }` — declared in `HubNavItem` but until now never read — opts an item back into strict matching. Dropdowns follow their children, so a section stays legible while its entries are collapsed.

## [22.7.2] - 2026-07-27

### Fixed

- **`aria-orientation` on the menu tree.** The root `menubar` now announces `vertical` when the nav renders as a sidebar (WAI-ARIA defaults `menubar` to horizontal, so vertical navs announced the wrong orientation to assistive tech); submenu `menu` surfaces and the overlay dropdowns declare `vertical` explicitly. Keyboard behavior was already orientation-aware — only the attribute was missing.

## [22.7.1] - 2026-07-26

### Fixed

- Declared the real `ng-hub-ui-utils` peer range: `>=22.7.0`. The library imports `resolveHubAccent` (utils 22.7.0), `HubOverflowTooltipDirective` and the overlay engine; the previous `>=1.0.0` floor resolved to a utils major that lacks those symbols, producing installs that compile but fail at runtime.

## [22.7.0] - 2026-07-08

### Added

- **Mobile drawer now honours the full nav template surface.** The offcanvas mobile panel forwards the `hubNavItemTemplate` (custom item content — icons, badges, rich markup) **and** projects the `hubNavStart` / `hubNavEnd` slots (brand header / footer), so the drawer matches the desktop nav instead of rendering bare items. New `HubNavMobilePanelComponent` inputs: `itemTemplate`, `startTemplate`, `endTemplate`.
- **`inDrawer` slot context.** `HubNavStartTemplateContext` / `HubNavEndTemplateContext` gain an optional `inDrawer` flag (true only inside the offcanvas drawer). Both the collapsed top bar and the drawer are `collapsed: true`; `inDrawer` lets consumers render a full header/footer in the drawer while keeping the collapsed top bar slim.
- **`--hub-nav-collapsed-justify`** — justify-content of the collapsed top-bar row (default `space-between`, so the brand/start slot sits at the leading edge and the toggler at the trailing edge).
- **`--hub-nav-border-radius` / `--hub-nav-box-shadow`** — container radius + elevation (default `0` / `none`), so the whole nav can be turned into a floating card (e.g. a sidebar rail) purely through tokens.

### Fixed

- **Vertical primary column no longer forces the panel width when there are no panels.** It previously pinned `--hub-nav-panel-width` (16rem) on the primary column always, overflowing a narrower rail. It now fills its container (`flex: 1 1 auto; width: 100%; min-width: 0`) by default, and only pins the fixed width under the new `.hub-nav--has-panels` host class (drill-down panels present). The `hubNavStart` / `hubNavEnd` slots therefore span the true container width.

### Changed

- **BREAKING — the semantic accent input `variant` is renamed to `color`**, for consistency with the rest of the hub-ui family (`<hub-button>`, `<hub-badge>`, `<hub-metrics>`, `<hub-milestone>`, all `color`). Its values are colours (`primary` / `success` / `danger` / … / any registered accent or literal), so `color` is the accurate name. Migration: `<hub-nav variant="primary">` → `<hub-nav color="primary">`. The internal `data-variant` attribute and the `:host([data-variant='…'])` token rules are unchanged.

## [22.6.0] - 2026-07-07

### Added

- **`hub-nav-theme(...)` SCSS mixin** — one-call token theming for `<hub-nav>`. `$accent` feeds the single `--hub-nav-accent` slot (the component derives the `-emphasis` / `-subtle` / `-on` family from it), alongside the bar surface (`$bg`, `$color`, `$border-color`, `$gap`, `$padding-x/y`) and the item appearance (`$item-color`, `$item-active-bg`, `$item-active-color`, `$item-border-radius`, `$item-font-size`, `$item-padding-x/y`). Every parameter is null-defaulted and additive; for any token not exposed, set the `--hub-nav-*` custom property directly.

### Changed

- **Packaging — the library now ships its SCSS at `/styles`.** `src/styles` is emitted to `dist/nav/styles`, exposing `hub-nav-theme` as a first-class package entry: `@use 'ng-hub-ui-nav/styles' as *;`.

## [22.5.0] - 2026-07-07

### Changed

- **`<hub-nav>` `variant` accepts ANY colour.** On top of the built-in semantic accents, the input now also accepts a **registered custom accent** and a **literal colour** (`#ff0000`, `rgb(...)`, `oklch(...)`, a CSS named colour), resolved through the shared `resolveHubAccent` helper (imported from `ng-hub-ui-utils`): a bareword becomes `var(--hub-sys-color-<name>, <name>)`; a literal is used as-is. The single `--hub-<comp>-accent` slot derives the rest of the family, so built-in colours are unchanged.
- **Internal — host bindings moved to the `host` metadata object.** `@HostBinding` / `@HostListener` decorators were replaced by the `host` object in the component/directive metadata (Angular style guide). No public API or behaviour change.

## [22.4.0] - 2026-07-02

### Changed

- `--hub-nav-accent-subtle` now uses the canonical design-system derivation — `color-mix(in oklch, var(--hub-nav-accent) 12%, var(--hub-sys-surface-page, #ffffff))` (was a `14%` mix) — in the base tokens and in the open-set `[data-variant]` rule. The subtle tint now matches the ds `-subtle` families exactly, so custom accents re-derive the full role family at runtime with the same values a built-in variant gets.

### Fixed

- **SSR/prerender no longer logs `requestAnimationFrame is not defined`.** `HubNavScrollSpyDirective` scheduled its `IntersectionObserver` setup through `requestAnimationFrame` on every platform; on the server (Angular prerender/SSR) that API does not exist and every route using the scroll spy logged a `ReferenceError`. The directive is now inert outside the browser (`isPlatformBrowser` guard in `scheduleInit`) — section tracking only ever ran client-side anyway.
- **Nav transitions actually run when the ds tokens are loaded.** The ds transition tokens are complete `transition` values (`all 0.15s ease-in-out`, `all 0.2s ease-in-out`), but the components composed them after a property name (`transition: background-color var(--hub-nav-item-transition)`), producing an invalid declaration and silently disabling every item/caret/panel/mobile transition whenever ds was present. All consumers now use the token as the full transition value.
- The accordion expand animation no longer references `--hub-sys-transition-collapse`: the ds value (`height 0.35s ease`) is a transition shorthand carrying a property name, which is invalid inside `animation` and silently disabled the expand animation with ds loaded. `--hub-nav-accordion-transition` is now a plain `0.35s ease` (same timing as ds).
- `--hub-nav-panel-transition` no longer prefixes `transform` to `--hub-sys-transition-base` (invalid once the token resolves to `all 0.2s ease-in-out`); it now resolves to the token directly.
- D1 fallbacks aligned with the actual ds values (they only apply when the ds tokens are not loaded): `--hub-ref-icon-size` → `1em` (was `1.25rem`, also in the icon width/height usage fallbacks), `--hub-sys-transition-fast` → `all 0.15s ease-in-out` (was `150ms ease`), `--hub-sys-transition-base` → `all 0.2s ease-in-out` (was `300ms ease`).
- Docs: `docs/css-variables-reference.md` default values resynchronized with the actual code declarations (now guarded by the repo-level `tokens-parity` check F).

## [22.3.0] - 2026-06-29

### Added

- **Tooltip on truncated item labels.** A nav item whose label is clipped with an ellipsis (the standard sidebar/menu behaviour) now reveals its full text on hover — applied automatically through `ng-hub-ui-utils`' new `[hubOverflowTooltip]` directive, only when the label actually overflows. The tooltip is **agnostic**: it uses the hub-ui tooltip by default but can be swapped for any implementation with `provideHubTooltip(...)`. No API changes; requires `ng-hub-ui-utils >= 22.6.0` and the tooltip styles (`@use 'ng-hub-ui-utils/styles/tooltip';`).

## [22.2.0] - 2026-06-26

### Added

- **Open-set accent variants.** `<hub-nav variant="…">` now accepts the full open accent set out of the box — `primary`, `secondary`, `success`, `danger`, `warning`, `info`, `neutral`, `light`, `dark` (previously only the first five chromatic ones re-based the accent). Any other variant still works at runtime with no recompile: define a single `--hub-sys-color-<name>` (e.g. `:root { --hub-sys-color-brand: #ff6b00; }`) and `<hub-nav variant="brand">` derives the whole hover/active treatment from it, via the new open-set `[data-variant]` rule.
- New derived accent roles `--hub-nav-accent-emphasis` (accent mixed over the theme ink) and `--hub-nav-accent-on` (the contrast colour for text sitting on the accent, a grayscale flip driven by the accent's lightness). Both follow the active accent/variant automatically.

### Changed

- Canonical `zindex` token names (BREAKING): `--hub-nav-dropdown-z-index` → `--hub-nav-dropdown-zindex`, `--hub-nav-mobile-z-index` → `--hub-nav-mobile-zindex`, `--hub-nav-panel-z-index` → `--hub-nav-panel-zindex` (no hyphen, matching the `--hub-sys-zindex-*` convention).
- All accent derivations (`--hub-nav-accent-subtle`, `--hub-nav-bg`, `--hub-nav-item-hover-bg`) now interpolate in the **OKLCH** colour space (`color-mix(in oklch, …)`) instead of sRGB, for perceptually even tints across every accent. No token API change; tints shift very slightly.

## [22.1.1] - 2026-06-25

### Fixed

- Design-token consistency pass: aligned inline fallback defaults with the canonical `ng-hub-ui-ds` values and routed hardcoded literals (z-index, font-weight, line-height, radii and theme-aware colours) through their `--hub-sys-*` / `--hub-ref-*` tokens, so they follow the active theme. No visual change when the ds tokens are loaded.

## [22.1.0] - 2026-06-24

### Added

- New `variant` input on `<hub-nav>` selecting the **semantic accent** of the hover/active affordances: `<hub-nav variant="success">` recolours the active item background and the hover link colour. The built-in variants (`primary` / `success` / `danger` / `warning` / `info`) render with the exact design-system tints; **any other string is also accepted** — the nav reads `--hub-sys-color-<variant>` from the host application, so a custom accent palette interconnects with no changes to the library. Defaults to `primary`. Mirrors the `<hub-panels>` accent system.
- New token `--hub-nav-accent` (defaults to `--hub-sys-color-primary`). `--hub-nav-item-hover-color` and `--hub-nav-item-active-bg` now resolve through this single accent instead of being hard-wired to `--hub-sys-color-primary`.
- **Richer accent treatment** for the item hover/active states: the hover and active backgrounds are now a soft `color-mix` tint of the accent (new `--hub-nav-accent-subtle`) and the active text uses the accent colour. In a **horizontal** navbar the active item also gains an accent **indicator bar** along its bottom edge (tabs-style underline); **vertical / sidebar navs are signalled by the tint + accent text alone — no inline-start bar**. New tokens `--hub-nav-accent-subtle`, `--hub-nav-item-active-indicator-color`, `--hub-nav-item-active-indicator-size`.
- The **nav surface** (`--hub-nav-bg`) now carries a faint wash of the accent (`color-mix(accent 5%, surface)`), so each `variant` reads as a distinctly-themed surface, not just via the active item.

### Changed

- **BREAKING (visual)**: the active item style moved from a solid accent fill + white text to a soft accent tint + accent text + accent indicator bar; the hover background is now an accent tint instead of a neutral grey; and the nav surface carries a faint accent wash instead of being pure white. Override `--hub-nav-item-active-bg` / `--hub-nav-item-active-color` / `--hub-nav-item-hover-bg` / `--hub-nav-bg` to restore the previous look.

### Fixed

- Aligned cross-layer token references with the canonical `ng-hub-ui-ds` names (no visual change; the components now follow the theme instead of only their inline fallback):
  - `--hub-sys-z-index-*` → `--hub-sys-zindex-*`
  - `--hub-sys-shadow-md` → `--hub-sys-shadow`
  - `--hub-sys-state-hover-overlay` → `--hub-sys-state-hover-bg`
  - `--hub-ref-border-radius-*` → `--hub-ref-radius-*`
  - `--hub-ref-font-weight-normal` → `--hub-ref-font-weight-base`

## [22.0.0] - 2026-06-17

### Changed

- Aligned with Angular 22.
- README documentation standardized.


## [21.1.1] - 2026-04-12

### Fixed

- Fixed panel mode behavior when a `nav-item` lacks a dedicated caret, ensuring the panel opens on label click.

### Documentation

- Updated `README.md` and `README.es.md` with live documentation links and corrected Hub UI family references.

## [21.1.0] - 2026-04-01

### Added

- Panel drill-down expand mode (`expandMode: 'panel'`) for vertical navigation.
- `HubNavPanelComponent` and `HubNavPanelContainerComponent` for stacked panel navigation.
- `HubNavPanelState` and `HubNavPanelEvent` models for panel state and events.
- Per-item `expandMode` override on `HubNavItem` (`'accordion' | 'flyout' | 'panel'`).
- `panelMaxVisible`, `sidebarSide`, and `panelWidth` configuration options on `HubNavConfig`.
- Panel stack management in `HubNavStateService` (open, close, drill-down, navigate back).
- `panelChange` output on `HubNavComponent` emitting `HubNavPanelEvent` for all panel actions.
- Keyboard navigation for panels: Escape closes, ArrowLeft navigates back.
- Focus management: auto-focus first item on panel open, return focus on close.
- Slide-in/out CSS animations for panels with `prefers-reduced-motion` support.
- Mobile fallback: panel mode automatically degrades to accordion when collapsed.
- CSS custom properties for panel styling (`--hub-nav-panel-*`).
- Host classes `hub-nav--sidebar-left` and `hub-nav--sidebar-right` for sidebar positioning.

### Changed

- Finalized package metadata for standalone publication under the `ng-hub-ui-nav` repository.
- Declared the package license as MIT and enabled public npm publication metadata.

### Documentation

- Added a complete English `README.md` with installation, usage, API, and styling guidance.
- Added a synchronized Spanish `README.es.md`.
- Added `BREAKING_CHANGES.md` for release-to-release migration tracking.
- Added English and Spanish CSS variables reference files under `docs/`.

## [21.0.0] - 2026-03-19

### Added

- Initial library scaffolding.
- `HubNavItem` interface with support for link, dropdown, header, separator, and custom item types.
- `HubNavConfig` interface with orientation, dropdown trigger, collapse mode, and positioning options.
- `HubNavItemTemplateContext` and `HubNavBrandTemplateContext` template context interfaces.
- `HubNavItemClickEvent` and `HubNavDropdownEvent` event interfaces.
- `HubNavConfigService` for global configuration management with signal-based reactivity.
- `HUB_NAV_CONFIG` injection token for providing configuration at application startup.
- Complete CSS custom properties token set (`--hub-nav-*`) integrated with the hub design system.
