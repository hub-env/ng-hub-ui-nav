# ng-hub-ui-nav

**Español** | [English](./README.md)

[![npm version](https://img.shields.io/npm/v/ng-hub-ui-nav.svg)](https://www.npmjs.com/package/ng-hub-ui-nav)
[![license](https://img.shields.io/npm/l/ng-hub-ui-nav.svg)](https://github.com/hub-env/ng-hub-ui-nav/blob/main/LICENSE)

Componente de navegación flexible, accesible y altamente personalizable para Angular 21+. Soporta menús horizontales, sidebars verticales, modos responsive para móvil, paneles apilados con drill-down, slots `start` y `end`, y soporte de scroll-spy.

> [!IMPORTANT]
> La versión `22.14.2` está orientada a Angular 22 y sigue la arquitectura basada en signals del ecosistema `ng-hub-ui`.

## Documentación y ejemplos en vivo

Este paquete forma parte de [Hub UI](https://hubui.dev/en/), una colección de bibliotecas de componentes Angular para aplicaciones standalone.

- Documentación: https://hubui.dev/en/nav/overview/
- Ejemplos en vivo: https://hubui.dev/en/nav/examples/
- Hub UI: https://hubui.dev/en/
- Hub UI en GitHub (incidencias, roadmap y cómo contribuir): https://github.com/hub-env/hub-ui

## 🧩 Familia `ng-hub-ui`

Esta biblioteca forma parte del ecosistema **ng-hub-ui**:

- [**ng-hub-ui-accordion**](https://www.npmjs.com/package/ng-hub-ui-accordion) (obsoleto — usa ng-hub-ui-panels)
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
- [**ng-hub-ui-nav**](https://www.npmjs.com/package/ng-hub-ui-nav) ← Estás aquí
- [**ng-hub-ui-paginable**](https://www.npmjs.com/package/ng-hub-ui-paginable)
- [**ng-hub-ui-panels**](https://www.npmjs.com/package/ng-hub-ui-panels)
- [**ng-hub-ui-portal**](https://www.npmjs.com/package/ng-hub-ui-portal)
- [**ng-hub-ui-skeleton**](https://www.npmjs.com/package/ng-hub-ui-skeleton)
- [**ng-hub-ui-sortable**](https://www.npmjs.com/package/ng-hub-ui-sortable)
- [**ng-hub-ui-stepper**](https://www.npmjs.com/package/ng-hub-ui-stepper)
- [**ng-hub-ui-utils**](https://www.npmjs.com/package/ng-hub-ui-utils)

## Índice

- [Características](#características)
- [Instalación](#instalación)
- [Inicio rápido](#inicio-rápido)
- [Ejemplos](#ejemplos)
- [Referencia de API](#referencia-de-api)
- [Estilos](#estilos)
- [Changelog](#changelog)
- [Contribuir](#contribuir)
- [Soporte](#soporte)
- [Colaboradores](#colaboradores)
- [Licencia](#licencia)

## Características

- Disposición horizontal y vertical.
- Modos responsive: `offcanvas`, `dropdown` y `fullscreen`.
- Modos de expansión vertical: `accordion`, `flyout` y `panel`.
- Navegación drill-down con paneles apilados y límite configurable.
- Slots proyectados `hubNavStart` y `hubNavEnd`.
- Render personalizado de items con `hubNavItemTemplate`.
- Estados activos sincronizados con Angular Router.
- Directivas de scroll-spy para documentación y páginas de una sola vista.
- Soporte de `sticky` en navegación vertical.
- **Rail de iconos de escritorio** — el input bidireccional `rail` colapsa una navegación vertical a `--hub-nav-rail-width` (4rem) mostrando solo iconos: las etiquetas aparecen como tooltips, los grupos accordion se abren como flyouts en overlay al hacer clic, y por debajo de `collapseBreakpoint` sigue ganando el comportamiento offcanvas. Incluye un toggle en el borde por defecto (`config.railToggle: false` para aportar el tuyo), totalmente tematizable con `--hub-nav-rail-toggle-*`, flecha SVG reemplazable incluida. La biblioteca no persiste nada; `railChange` permite a la aplicación guardar la preferencia.
- Sistema de acento semántico `color` (`primary` / `success` / `danger` / `warning` / `info`, además de cualquier acento personalizado o color literal) que recolorea los estados hover/activo — replica el de `<hub-panels>`.
- Personalización completa mediante variables CSS `--hub-nav-*`.

## Instalación

```bash
npm install ng-hub-ui-nav
```

## Inicio rápido

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

## Ejemplos

### Sidebar vertical con paneles

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

### Slots start y end

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

### Scroll spy

```html
<section
	hubNavScrollSpy
	(activeSectionChange)="activeSection = $event"
>
	<section id="overview" hubNavScrollSpySection>...</section>
	<section id="api" hubNavScrollSpySection>...</section>
</section>
```

### Rail de iconos colapsado

```html
<hub-nav
	[items]="items"
	[(rail)]="rail"
	[config]="{ orientation: 'vertical', verticalExpandMode: 'accordion' }"
>
	<!-- El contexto del slot expone el estado del rail, p. ej. para cambiar el logo por una marca -->
	<ng-template hubNavStart let-rail="rail">
		<span class="brand">{{ rail ? 'A' : 'Acme ERP' }}</span>
	</ng-template>
</hub-nav>
```

En el borde exterior de la columna primaria se incluye un botón de colapso: una flecha dentro de un contenedor, gobernado por completo por los tokens `--hub-nav-rail-toggle-*` (tamaño, padding, borde, radius, colores, sombra, offsets y el propio glifo vía la máscara SVG `--hub-nav-rail-toggle-icon`). Con `config.railToggle: false` se oculta y `[(rail)]` se controla desde un control propio. Con el rail activo, el ancho del host es `--hub-nav-rail-width` (4rem por defecto), las etiquetas conservan su nombre accesible y aparecen como tooltips, y los grupos se abren como flyouts en overlay al hacer clic. Por debajo de `collapseBreakpoint` el flag se ignora — el móvil mantiene el offcanvas. `railChange` notifica cada cambio (toggle integrado incluido) para que la aplicación persista la preferencia.

## Referencia de API

### `HubNavComponent`

#### Inputs

| Input | Type | Default | Description |
|---|---|---|---|
| `items` | `HubNavItem[]` | required | Árbol de navegación a renderizar. |
| `config` | `Partial<HubNavConfig>` | `{}` | Configuración por instancia combinada con los defaults globales. |
| `navClass` | `string` | `''` | Clase adicional aplicada al `<nav>` interno. |
| `itemTemplate` | `TemplateRef<unknown> \| null` | `null` | Plantilla opcional para renderizar items. |
| `autoOpenFromRoute` | `boolean` | `false` | Abre dropdowns/paneles en función de la ruta activa y deja una sola sección abierta cuando las raíces se expanden de formas distintas: al llegar a una raíz en acordeón se cierra el panel de la raíz que dejas, y al revés. También reconstruye la pila cuando la ventana vuelve por encima de `collapseBreakpoint`; con el input desactivado, una pila abierta a mano sobrevive a ese viaje de ida y vuelta. |
| `rail` | `boolean` (bidireccional, `model`) | `false` | Rail de iconos solo de escritorio para navegaciones verticales. Se ignora por debajo de `collapseBreakpoint`. Se enlaza con `[(rail)]`. |
| `color` | `'primary' \| 'success' \| 'danger' \| 'warning' \| 'info' \| string \| undefined` | `undefined` (se lee como `primary`) | Acento semántico para los estados hover/activo. Una palabra suelta —nombre semántico, acento registrado o color con nombre de CSS— se resuelve mediante `--hub-sys-color-<nombre>`; un literal `#hex` / `rgb()` / `oklch()` / `var()` se usa tal cual. |

#### Outputs

| Output | Type | Description |
|---|---|---|
| `itemClick` | `OutputEmitterRef<HubNavItem>` | Se emite cuando se activa un item navegable. |
| `dropdownOpen` | `OutputEmitterRef<HubNavItem>` | Se emite cuando se abre un dropdown. |
| `dropdownClose` | `OutputEmitterRef<HubNavItem>` | Se emite cuando se cierra un dropdown. |
| `mobileToggle` | `OutputEmitterRef<boolean>` | Se emite al abrir o cerrar el panel responsive. |
| `panelChange` | `OutputEmitterRef<HubNavPanelEvent>` | Se emite al abrir, cerrar o navegar dentro de paneles. |
| `railChange` | `OutputEmitterRef<boolean>` | Se emite cuando el modelo `rail` cambia — persístelo en la aplicación para restaurar el rail al arrancar. |

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

`railToggle` (por defecto `true`) dibuja el toggle de rail integrado en el borde exterior de una navegación vertical de escritorio; ponlo a `false` para aportar tu propio control.

`activeIndicator` (por defecto `false`) traslada la marca de activo a un único elemento compartido por la lista, de modo que viaje entre hermanos en vez de aparecer en el sitio. Es opcional porque la marca deja de pintarla cada item, así que una regla sobre `.hub-nav-item__link--active` deja de aplicar. Respeta `prefers-reduced-motion`.

`followReplacedUrls` (por defecto `true`) decide con cuánta avidez sigue la navegación una URL **reemplazada** en vez de apilada — que es lo que hace un scroll spy mientras la persona lee. `true` sigue cada aviso; un **número** sigue solo cuando los avisos llevan esos milisegundos en silencio, así la marca aterriza donde la lectura se detuvo en lugar de bajar por el menú; `false` no sigue nunca y marca solo donde se ha elegido ir. Los enlaces profundos no se ven afectados en ningún caso.

`labels` sobrescribe por instancia las cadenas accesibles integradas (`toggleNavigation`, `closeNavigation`, `collapseNavigation`, `expandNavigation`, `goBack`, `closePanel`, `toggleSection` — esta última admite el marcador `{label}`). Sin sobrescritura, cada etiqueta se resuelve desde las claves compartidas `HUBUI.NAV.*` (`provideHubTranslationAdapter()` de `ng-hub-ui-utils`) y finalmente cae al inglés.


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

#### Coincidencia de ruta activa

Un item se marca activo en su propia ruta **y en cualquiera por debajo de ella**,
de modo que abrir un registro mantiene marcada su sección: `/customers` sigue
activo en `/customers/42/edit`. La comparación es por segmentos completos —
`/products` no se marca con `/products-archive` — y la query string se ignora. Un
item raíz (`/`) solo coincide consigo mismo en lugar de reclamar todas las
páginas, y un desplegable sigue a sus hijos, así que la sección permanece legible
aunque sus entradas estén plegadas.

Cuando la ruta de un item queda por debajo de la de otro, solo se marca el más
específico: en `/products/categories` se marca la entrada del catálogo y no
`/products`, mientras que en `/products/42/edit` la lista conserva su marca
porque no hay nada más específico que coincida.

Usa `routerLinkActiveOptions: { exact: true }` en el item que solo deba marcarse
en su ruta exacta:

```typescript
{ id: 'home', label: 'Home', type: 'link', route: '/', routerLinkActiveOptions: { exact: true } }
```

### Directivas

- `hubNavStart`: proyecta contenido al inicio.
- `hubNavEnd`: proyecta contenido al final.
- `hubNavItemTemplate`: sustituye el render por defecto del item.
- `hubNavScrollSpy`: detecta la sección visible en un contenedor con scroll.
- `hubNavScrollSpySection`: marca una sección como observable por el scroll spy.

## Estilos

El componente expone un conjunto completo de tokens `--hub-nav-*`. La referencia completa está en:

- [CSS Variables Reference](docs/css-variables-reference.md)

### Recolorear toda la navegación desde un único acento

Los estados hover/activo y la superficie de la navegación derivan todos de un único acento. Defínelo (o usa el input `color`) para re-tematizar la navegación entera:

```css
.my-sidebar {
	--hub-nav-panel-width: 18rem;
	/* Único punto de recoloreo — el fondo activo con tinte, el texto de acento,
	   el tinte de hover, la barra indicadora y el lavado de la superficie siguen
	   este único acento. */
	--hub-nav-accent: var(--hub-sys-color-success);
	--hub-nav-dropdown-shadow: 0 0.75rem 1.5rem rgba(0, 0, 0, 0.16);
}
```

### Vestir la barra con un degradado

El relleno son un color y una imagen en dos propiedades distintas, así que un degradado va en
`--hub-nav-bg-image` y nunca en `--hub-nav-bg`. No es una manía de estilo: un degradado es una
`<image>`, así que un `var()` que lo lleve sustituido dentro de `background-color` computa a un
valor inválido y tira la declaración entera — la barra se quedaría sin fondo en vez de caer al
color de respaldo. Separados, `--hub-nav-bg` se queda debajo como reserva.

```css
.my-sidebar {
	--hub-nav-bg: #4c1d95;
	--hub-nav-bg-image: linear-gradient(180deg, #6d28d9, #4c1d95);
}
```

### Restaurar el aspecto clásico de relleno sólido

El item activo por defecto ahora es un tinte suave de acento + texto de acento. Para restaurar el relleno sólido de acento + texto blanco anterior (el aspecto previo a `22.1.0`), sobrescribe estos tokens explícitamente:

```css
.my-sidebar {
	--hub-nav-item-active-bg: #0d6efd;
	--hub-nav-item-active-color: #ffffff;
	--hub-nav-item-hover-bg: rgba(0, 0, 0, 0.04);
	--hub-nav-bg: #ffffff;
}
```

## Changelog

Puedes consultar el historial completo de versiones en [CHANGELOG.md](CHANGELOG.md).

Si actualizas entre versiones, revisa también [BREAKING_CHANGES.md](BREAKING_CHANGES.md).

## Contribuir

Se aceptan issues, debates y pull requests.

Si quieres contribuir:

1. Haz un fork del repositorio.
2. Crea una rama para tu cambio.
3. Mantén documentados los cambios de API en el README y en el changelog.
4. Abre una pull request con una descripción clara del cambio.

## Soporte

Si esta biblioteca te resulta útil, puedes apoyar su mantenimiento aquí:

- [Buy Me a Coffee](https://buymeacoffee.com/carlosmorcillo)

## Colaboradores

Creada y mantenida por [Carlos Morcillo Fernández](https://www.carlosmorcillo.com).

## Soporte comercial

Mantengo estas librerías yo mismo: soy [Carlos Morcillo Fernández](https://www.carlosmorcillo.com), arquitecto frontend autónomo, y trabajo con equipos que construyen y mantienen aplicaciones Angular.

Si tu equipo depende de Hub-UI y necesita más de lo que se resuelve en un hilo de incidencias, eso es a lo que me dedico: auditorías de arquitectura, sistemas de diseño, migraciones de Angular y mentoría de equipos. Cuando el proyecto pide además diseño y un equipo completo, lo llevo por [Frog Hub](https://froghub.es), mi estudio de desarrollo.

Aquí están [los servicios](https://www.carlosmorcillo.com/servicios/) y aquí puedes [contarme tu proyecto](https://www.carlosmorcillo.com/contacto/).

## Licencia

Este proyecto está licenciado bajo MIT. Consulta el fichero [LICENSE](LICENSE) para más detalle.
