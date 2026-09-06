# ng-hub-ui-nav — CSS Variables Reference

This document lists the CSS custom properties exposed by `ng-hub-ui-nav`.

## Usage

Import the library styles and override tokens at component, page, or theme level.

```scss
@use 'ng-hub-ui-nav/src/lib/styles/nav-tokens';
```

## Layout

| Variable | Default |
|---|---|
| `--hub-nav-height` | `3.5rem` |
| `--hub-nav-padding-x` | `var(--hub-ref-space-3, 1rem)` |
| `--hub-nav-padding-y` | `var(--hub-ref-space-2, 0.5rem)` |
| `--hub-nav-gap` | `var(--hub-ref-space-1, 0.25rem)` |
| `--hub-nav-horizontal-padding-y` | `0` |
| `--hub-nav-horizontal-padding-x` | `0` |
| `--hub-nav-horizontal-row-gap` | `0` |
| `--hub-nav-horizontal-items-justify` | `center` |
| `--hub-nav-horizontal-items-overflow-x` | `auto` |
| `--hub-nav-horizontal-items-overflow-y` | `hidden` |
| `--hub-nav-vertical-items-overflow-y` | `auto` |
| `--hub-nav-vertical-items-overflow-x` | `hidden` |
| `--hub-nav-vertical-panel-padding-inline` | `var(--hub-ref-space-2, 0.5rem)` |
| `--hub-nav-vertical-panel-padding-block` | `0` |
| `--hub-nav-horizontal-panel-padding-y` | `var(--hub-ref-space-2, 0.5rem)` |
| `--hub-nav-horizontal-panel-padding-x` | `0` |
| `--hub-nav-sticky-top` | `set by component config` |

## Scrollbars

| Variable | Default |
|---|---|
| `--hub-nav-scrollbar-width` | `none` |
| `--hub-nav-scrollbar-color` | `transparent transparent` |
| `--hub-nav-scrollbar-webkit-size` | `0` |
| `--hub-nav-scrollbar-thumb-color` | `transparent` |
| `--hub-nav-scrollbar-track-color` | `transparent` |
| `--hub-nav-scrollbar-thumb-radius` | `var(--hub-ref-radius-pill, 50rem)` |

## Surface and Borders

| Variable | Default |
|---|---|
| `--hub-nav-accent` | `var(--hub-sys-color-primary, #0d6efd)` |
| `--hub-nav-accent-subtle` | `color-mix(in oklch, var(--hub-nav-accent) 12%, var(--hub-sys-surface-page, #ffffff))` |
| `--hub-nav-bg` | `color-mix(in oklch, var(--hub-nav-accent) 5%, var(--hub-sys-surface-page, #fff))` |
| `--hub-nav-color` | `var(--hub-sys-text-primary, #212529)` |
| `--hub-nav-border-color` | `var(--hub-sys-border-color-default, #dee2e6)` |
| `--hub-nav-border-width` | `1px` |
| `--hub-nav-border-style` | `solid` |

The single `--hub-nav-accent` hook (re-based per the `color` input) drives the hover/active tints, the active text colour, the indicator bar, and the surface wash — recolour the whole nav from one place.

## Brand Slots

| Variable | Default |
|---|---|
| `--hub-nav-brand-font-size` | `var(--hub-ref-font-size-lg, 1.25rem)` |
| `--hub-nav-brand-font-weight` | `var(--hub-ref-font-weight-semibold, 600)` |
| `--hub-nav-brand-color` | `var(--hub-sys-text-primary, #212529)` |
| `--hub-nav-brand-padding-x` | `var(--hub-ref-space-2, 0.5rem)` |

## Items

| Variable | Default |
|---|---|
| `--hub-nav-item-padding-x` | `var(--hub-nav-mobile-item-padding-inline, 0.75rem)` |
| `--hub-nav-item-padding-y` | `var(--hub-ref-space-2, 0.5rem)` |
| `--hub-nav-item-color` | `var(--hub-sys-text-primary, #212529)` |
| `--hub-nav-item-font-size` | `var(--hub-ref-font-size-base, 1rem)` |
| `--hub-nav-item-font-weight` | `var(--hub-ref-font-weight-base, 400)` |
| `--hub-nav-item-border-radius` | `var(--hub-ref-radius-sm, 0.25rem)` |
| `--hub-nav-item-transition` | `var(--hub-sys-transition-fast, all 0.15s ease-in-out)` |
| `--hub-nav-item-hover-bg` | `color-mix(in oklch, var(--hub-nav-accent) 8%, var(--hub-sys-surface-page, #fff))` |
| `--hub-nav-item-hover-color` | `var(--hub-nav-accent)` |
| `--hub-nav-item-active-bg` | `var(--hub-nav-accent-subtle)` |
| `--hub-nav-item-active-color` | `var(--hub-nav-accent)` |
| `--hub-nav-item-active-font-weight` | `var(--hub-ref-font-weight-semibold, 600)` |
| `--hub-nav-item-active-indicator-color` | `var(--hub-nav-accent)` |
| `--hub-nav-item-active-indicator-size` | `3px` |
| `--hub-nav-item-disabled-color` | `var(--hub-sys-text-muted, #6c757d)` |
| `--hub-nav-item-disabled-opacity` | `var(--hub-sys-opacity-disabled, 0.65)` |

The active indicator bar (`--hub-nav-item-active-indicator-*`) renders only on horizontal navbars; vertical/sidebar navs are signalled by the tint + accent text alone.

## Dropdown and Caret

| Variable | Default |
|---|---|
| `--hub-nav-dropdown-bg` | `var(--hub-sys-surface-elevated, #f8f9fa)` |
| `--hub-nav-dropdown-color` | `var(--hub-sys-text-primary, #212529)` |
| `--hub-nav-dropdown-border-color` | `var(--hub-sys-border-color-default, #dee2e6)` |
| `--hub-nav-dropdown-border-radius` | `var(--hub-nav-item-border-radius, var(--hub-ref-radius-sm, 0.25rem))` |
| `--hub-nav-dropdown-shadow` | `var(--hub-sys-shadow, 0 0.5rem 1rem rgba(0, 0, 0, 0.15))` |
| `--hub-nav-dropdown-padding-y` | `var(--hub-ref-space-2, 0.5rem)` |
| `--hub-nav-dropdown-min-width` | `12rem` |
| `--hub-nav-dropdown-zindex` | `var(--hub-sys-zindex-dropdown, 1000)` |
| `--hub-nav-caret-size` | `0.3rem` |
| `--hub-nav-caret-color` | `currentColor` |

## Headers and Separators

| Variable | Default |
|---|---|
| `--hub-nav-header-font-size` | `var(--hub-ref-font-size-sm, 0.875rem)` |
| `--hub-nav-header-font-weight` | `var(--hub-ref-font-weight-semibold, 600)` |
| `--hub-nav-header-color` | `var(--hub-sys-text-muted, #6c757d)` |
| `--hub-nav-header-padding-x` | `var(--hub-ref-space-3, 1rem)` |
| `--hub-nav-header-padding-y` | `var(--hub-ref-space-1, 0.25rem)` |
| `--hub-nav-header-margin-top` | `var(--hub-ref-space-3, 1rem)` |
| `--hub-nav-header-margin-inline-start` | `var(--hub-ref-space-3, 1rem)` |
| `--hub-nav-header-horizontal-padding-inline-start` | `2rem` |
| `--hub-nav-separator-color` | `var(--hub-sys-border-color-default, #dee2e6)` |
| `--hub-nav-separator-margin-y` | `var(--hub-ref-space-2, 0.5rem)` |

## Badge and Icon

| Variable | Default |
|---|---|
| `--hub-nav-badge-font-size` | `var(--hub-ref-font-size-xs, 0.75rem)` |
| `--hub-nav-badge-padding-x` | `0.5em` |
| `--hub-nav-badge-padding-y` | `0.25em` |
| `--hub-nav-badge-bg` | `var(--hub-sys-color-danger, #dc3545)` |
| `--hub-nav-badge-color` | `var(--hub-ref-color-white, #fff)` |
| `--hub-nav-badge-border-radius` | `var(--hub-ref-radius-pill, 50rem)` |
| `--hub-nav-icon-size` | `var(--hub-ref-icon-size, 1em)` |
| `--hub-nav-icon-gap` | `var(--hub-ref-space-2, 0.5rem)` |

## Toggler and Mobile

| Variable | Default |
|---|---|
| `--hub-nav-toggler-padding-x` | `var(--hub-ref-space-2, 0.5rem)` |
| `--hub-nav-toggler-padding-y` | `var(--hub-ref-space-1, 0.25rem)` |
| `--hub-nav-toggler-font-size` | `var(--hub-ref-font-size-lg, 1.25rem)` |
| `--hub-nav-toggler-color` | `var(--hub-sys-text-primary, #212529)` |
| `--hub-nav-toggler-border-color` | `var(--hub-sys-border-color-default, #dee2e6)` |
| `--hub-nav-toggler-border-radius` | `var(--hub-ref-radius-sm, 0.25rem)` |
| `--hub-nav-mobile-bg` | `var(--hub-sys-surface-page, #fff)` |
| `--hub-nav-mobile-color` | `var(--hub-sys-text-primary, #212529)` |
| `--hub-nav-mobile-width` | `18rem` |
| `--hub-nav-mobile-zindex` | `var(--hub-sys-zindex-fixed, 1030)` |
| `--hub-nav-mobile-backdrop-bg` | `rgba(0, 0, 0, 0.5)` |
| `--hub-nav-mobile-transition` | `var(--hub-sys-transition-base, all 0.2s ease-in-out)` |
| `--hub-nav-mobile-accordion-gap` | `component-defined` |
| `--hub-nav-mobile-accordion-nested-spacing` | `component-defined` |
| `--hub-nav-mobile-body-padding-block-end` | `component-defined` |
| `--hub-nav-mobile-body-padding-inline` | `component-defined` |
| `--hub-nav-mobile-border-color` | `component-defined` |
| `--hub-nav-mobile-item-padding-inline` | `component-defined` |
| `--hub-nav-mobile-overlay-position` | `component-defined` |
| `--hub-nav-mobile-root-padding-inline` | `component-defined` |
| `--hub-nav-mobile-shadow` | `component-defined` |

## Rail (desktop icon-only sidebar)

| Variable | Default |
|---|---|
| `--hub-nav-rail-width` | `4rem` |
| `--hub-nav-rail-transition` | `width 0.2s ease-in-out` |

### Rail toggle (built-in collapse/expand button)

| Variable | Default |
|---|---|
| `--hub-nav-rail-toggle-size` | `1.75rem` |
| `--hub-nav-rail-toggle-padding` | `0.25rem` |
| `--hub-nav-rail-toggle-color` | `var(--hub-nav-item-color, #212529)` |
| `--hub-nav-rail-toggle-bg` | `var(--hub-sys-surface-elevated, #fff)` |
| `--hub-nav-rail-toggle-hover-color` | `var(--hub-nav-item-hover-color, #0d6efd)` |
| `--hub-nav-rail-toggle-hover-bg` | `var(--hub-nav-item-hover-bg, rgba(0, 0, 0, 0.04))` |
| `--hub-nav-rail-toggle-border-width` | `1px` |
| `--hub-nav-rail-toggle-border-color` | `var(--hub-nav-border-color, #dee2e6)` |
| `--hub-nav-rail-toggle-border-radius` | `var(--hub-ref-radius-pill, 50rem)` |
| `--hub-nav-rail-toggle-shadow` | `var(--hub-sys-shadow-sm, 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075))` |
| `--hub-nav-rail-toggle-icon` | chevron SVG (`url(...)` mask, replaceable) |
| `--hub-nav-rail-toggle-icon-size` | `0.875em` |
| `--hub-nav-rail-toggle-inset-block` | `50%` |
| `--hub-nav-rail-toggle-inset-inline` | `calc(var(--hub-nav-rail-toggle-size, 1.75rem) / -2)` |
| `--hub-nav-rail-toggle-zindex` | `calc(var(--hub-nav-panel-zindex, 1000) + 1)` |
| `--hub-nav-rail-toggle-transition` | `var(--hub-sys-transition-fast, all 0.15s ease-in-out)` |

## Accordion and Panel Mode

| Variable | Default |
|---|---|
| `--hub-nav-accordion-indent` | `var(--hub-ref-space-3, 1rem)` |
| `--hub-nav-accordion-transition` | `0.35s ease` |
| `--hub-nav-panel-width` | `16rem` |
| `--hub-nav-panel-bg` | `var(--hub-sys-surface-elevated, #f8f9fa)` |
| `--hub-nav-panel-color` | `var(--hub-sys-text-primary, #212529)` |
| `--hub-nav-panel-border-color` | `var(--hub-sys-border-color-default, #dee2e6)` |
| `--hub-nav-panel-border-width` | `1px` |
| `--hub-nav-panel-shadow` | `var(--hub-sys-shadow-sm, 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075))` |
| `--hub-nav-panel-zindex` | `var(--hub-sys-zindex-dropdown, 1000)` |
| `--hub-nav-panel-transition` | `var(--hub-sys-transition-base, all 0.2s ease-in-out)` |
| `--hub-nav-panel-header-height` | `3rem` |
| `--hub-nav-panel-header-bg` | `var(--hub-sys-surface-page, #fff)` |
| `--hub-nav-panel-header-border-color` | `var(--hub-sys-border-color-default, #dee2e6)` |
| `--hub-nav-panel-header-font-size` | `var(--hub-ref-font-size-sm, 0.875rem)` |
| `--hub-nav-panel-header-font-weight` | `var(--hub-ref-font-weight-semibold, 600)` |
| `--hub-nav-panel-header-padding-x` | `var(--hub-ref-space-3, 1rem)` |
| `--hub-nav-panel-back-color` | `var(--hub-sys-text-primary, #212529)` |
| `--hub-nav-panel-back-hover-bg` | `var(--hub-sys-state-hover-bg, rgba(0, 0, 0, 0.075))` |
| `--hub-nav-panel-back-size` | `2rem` |
