import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponentRef } from '@angular/core';
import { provideRouter } from '@angular/router';
import { HubNavPanelComponent } from './nav-panel.component';
import { HubNavStateService } from '../../services/nav-state.service';
import { HubNavPanelState } from '../../models/nav-panel-state.model';

describe('HubNavPanelComponent', () => {
	let component: HubNavPanelComponent;
	let componentRef: ComponentRef<HubNavPanelComponent>;
	let fixture: ComponentFixture<HubNavPanelComponent>;

	const mockPanel: HubNavPanelState = {
		id: 'panel-1',
		parentItem: {
			id: 'docs',
			label: 'Documentation',
			type: 'dropdown',
			children: [
				{ id: 'getting-started', label: 'Getting Started', type: 'link', route: '/docs/start' },
				{ id: 'api', label: 'API Reference', type: 'link', route: '/docs/api' }
			]
		},
		items: [
			{ id: 'getting-started', label: 'Getting Started', type: 'link', route: '/docs/start' },
			{ id: 'api', label: 'API Reference', type: 'link', route: '/docs/api' }
		],
		history: [],
		isDrillDown: false
	};

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [HubNavPanelComponent],
			providers: [HubNavStateService, provideRouter([])]
		}).compileComponents();

		fixture = TestBed.createComponent(HubNavPanelComponent);
		component = fixture.componentInstance;
		componentRef = fixture.componentRef;
		componentRef.setInput('panel', mockPanel);
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('should have role navigation', () => {
		expect(fixture.nativeElement.getAttribute('role')).toBe('navigation');
	});

	it('should have aria-label with parent item label', () => {
		expect(fixture.nativeElement.getAttribute('aria-label')).toBe('Documentation navigation');
	});

	it('should display the parent item label in the header', () => {
		const title = fixture.nativeElement.querySelector('.hub-nav-panel__title');
		expect(title.textContent.trim()).toBe('Documentation');
	});

	it('should not show back button when not in drill-down mode', () => {
		const backButton = fixture.nativeElement.querySelector('.hub-nav-panel__back');
		expect(backButton).toBeNull();
	});

	it('should show back button when in drill-down mode', () => {
		const drillDownPanel: HubNavPanelState = { ...mockPanel, isDrillDown: true };
		componentRef.setInput('panel', drillDownPanel);
		fixture.detectChanges();
		const backButton = fixture.nativeElement.querySelector('.hub-nav-panel__back');
		expect(backButton).not.toBeNull();
	});

	it('should emit closePanel when close button is clicked', () => {
		const spy = vi.fn();
		component.closePanel.subscribe(spy);
		const closeButton = fixture.nativeElement.querySelector('.hub-nav-panel__close');
		closeButton.click();
		expect(spy).toHaveBeenCalledWith('panel-1');
	});

	it('should emit backClick when back button is clicked', () => {
		const drillDownPanel: HubNavPanelState = { ...mockPanel, isDrillDown: true };
		componentRef.setInput('panel', drillDownPanel);
		fixture.detectChanges();

		const spy = vi.fn();
		component.backClick.subscribe(spy);
		const backButton = fixture.nativeElement.querySelector('.hub-nav-panel__back');
		backButton.click();
		expect(spy).toHaveBeenCalledWith('panel-1');
	});

	it('should emit closePanel on Escape key', () => {
		const spy = vi.fn();
		component.closePanel.subscribe(spy);
		fixture.nativeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
		expect(spy).toHaveBeenCalledWith('panel-1');
	});

	it('should emit closePanel on ArrowLeft when focus is inside the direct panel list', () => {
		const spy = vi.fn();
		component.closePanel.subscribe(spy);
		const directList = fixture.nativeElement.querySelector('hub-nav-item-list') as HTMLElement;
		const fakeItem = document.createElement('button');
		directList.appendChild(fakeItem);

		// The inner item-list stops propagation of its own ArrowLeft handling, so a
		// bubbling event never reaches the panel host. Invoke the panel handler
		// directly with a target inside the direct list to exercise the
		// direct-list ownership check (isDirectPanelFocus).
		const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
		Object.defineProperty(event, 'target', { value: fakeItem });
		component.onKeyDown(event);

		expect(spy).toHaveBeenCalledWith('panel-1');
	});

	it('should render item-list with panel items', () => {
		const itemList = fixture.nativeElement.querySelector('hub-nav-item-list');
		expect(itemList).not.toBeNull();
	});

	it('should apply drill-down host class when isDrillDown is true', () => {
		const drillDownPanel: HubNavPanelState = { ...mockPanel, isDrillDown: true };
		componentRef.setInput('panel', drillDownPanel);
		fixture.detectChanges();
		expect(fixture.nativeElement.classList.contains('hub-nav-panel--drill-down')).toBe(true);
	});

	/**
	 * The half a class assertion cannot reach.
	 *
	 * Marking the terminal panel is only useful if the rules that key off it can match, and
	 * two of them could not: `:host-context(A):host(B)` is collapsed by Angular's shim into a
	 * single compound — `A.B[_nghost]` — which asks one element to carry both a class of the
	 * container and a class of the panel. It never matched, so a right-hand sidebar drew its
	 * closing border on the inner edge and a horizontal nav drew one it should not have. No
	 * error, because a selector that matches nothing raises none.
	 *
	 * Written as `:host-context(A).B`, the shim emits the descendant form alongside the
	 * compound, and the descendant is the one that matches. This pins that shape.
	 */
	it('scopes the terminal-panel rules to an ancestor, not to one compound element', () => {
		const rules: string[] = [];

		for (const sheet of [...document.styleSheets]) {
			let cssRules: CSSRule[];
			try {
				cssRules = [...(sheet.cssRules ?? [])];
			} catch {
				continue; // another origin: not ours, and not readable
			}
			for (const rule of cssRules) {
				const selector = (rule as CSSStyleRule).selectorText;
				if (selector?.includes('hub-nav-panel--last') && /container--right|nav--horizontal/.test(selector)) {
					rules.push(selector);
				}
			}
		}

		expect(rules.length).toBeGreaterThan(0);

		// Each of them has to offer at least one alternative where the container class sits on
		// an ANCESTOR — a descendant combinator — rather than on the panel itself.
		for (const selector of rules) {
			const hasDescendantForm = selector
				.split(',')
				.some((part) => /(container--right|nav--horizontal)\s+\S/.test(part.trim()));

			expect(hasDescendantForm).toBe(true);
		}
	});

	it('should mark the terminal panel so a vertical stack can close its outer edge', () => {
		componentRef.setInput('isLast', true);
		fixture.detectChanges();
		expect(fixture.nativeElement.classList.contains('hub-nav-panel--last')).toBe(true);
	});

	it('should use the configured back and close labels', () => {
		const state = TestBed.inject(HubNavStateService);
		state.setConfig({ ...state.config(), labels: { goBack: 'Volver', closePanel: 'Cerrar panel' } });
		componentRef.setInput('panel', {
			...mockPanel,
			isDrillDown: true,
			history: [{ items: [], parentItem: { id: 'root', label: 'Root', type: 'dropdown' } }]
		});
		fixture.detectChanges();
		const back = fixture.nativeElement.querySelector('.hub-nav-panel__back');
		const close = fixture.nativeElement.querySelector('.hub-nav-panel__close');
		expect(back.getAttribute('aria-label')).toBe('Volver');
		expect(close.getAttribute('aria-label')).toBe('Cerrar panel');
	});
});
