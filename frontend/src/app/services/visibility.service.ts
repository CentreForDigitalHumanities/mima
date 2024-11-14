import { Injectable, NgZone, OnDestroy, QueryList } from '@angular/core';
import { FilterWorkerService } from './filter-worker.service';
import { Subject, Subscription, throttleTime } from 'rxjs';
import { FilterObjectName } from '../models/filter';

/**
 * A component which will only be fully rendered once it is scrolled into view
 */
export interface IntersectableComponent<TModel> {
    /**
     * The ID identifying this component; if it is into view
     * the model information will be set
     */
    id: string;

    /**
     * The model to render.
     */
    model: TModel

    /**
     * Native element used to render this component.
     */
    nativeElement: HTMLElement;

    loading: boolean;
}

/**
 * Logic for components which are only rendered once they are scrolled into view
 */
@Injectable({
    providedIn: 'root'
})
export abstract class VisibilityService<TComponent extends IntersectableComponent<TModel>, TModel> implements OnDestroy {
    /**
     * Components displaying models, using the ID as key
     */
    private components: { [id: string]: TComponent } = {};

    private componentQueryList: QueryList<TComponent>;

    private visibleIds: Set<string> = new Set<string>();

    protected subscriptions: Subscription[] = [];

    private models: Map<string, TModel> | ReadonlyMap<string, TModel>;

    /**
     * A render should be triggered
     */
    private triggerRender = new Subject<void>();

    /**
     * Tracks which components have become visible or hidden
     */
    private componentsObserver: IntersectionObserver;

    constructor(protected filterWorkerService: FilterWorkerService, private ngZone: NgZone) {
    }

    ngOnDestroy(): void {
        for (const subscription of this.subscriptions) {
            subscription.unsubscribe();
        }
    }

    protected abstract getId(model: TModel): string;

    /**
     * Directly triggers the visible components to have their content updated.
     * @param matches results which should at least apply to all the visible models
     */
    protected updateVisible(matches: Iterable<TModel>) {
        // make a copy, so we can remove all matching model IDs
        const visibleIds = [...this.visibleIds];
        for (const model of matches) {
            if (visibleIds.length === 0) {
                break;
            }

            const index = visibleIds.indexOf(this.getId(model));
            if (index !== -1) {
                const [modelId] = visibleIds.splice(index, 1);
                const component = this.components[modelId];
                if (component) {
                    // immediately set the model to update rendering
                    component.model = model;
                }
            }
        }

        // these weren't in the matches, so we know they should be hidden
        for (const modelId of visibleIds) {
            const component = this.components[modelId];
            if (component) {
                component.model = undefined;
            }
        }
    }

    registerComponent(component: TComponent) {
        this.components[component.id] = component;
    }

    /**
     * Removes the registration for a component on clean-up.
     */
    unregisterComponent(component: TComponent) {
        delete this.components[component.id];
    }

    /**
     * Gets all the visible components
     */
    *visibleComponents(): Iterable<TComponent> {
        for (const componentId of this.visibleIds) {
            const component = this.components[componentId];
            if (component) {
                yield component;
            }
        }
    }

    addVisibleId(type: FilterObjectName, id: string): void {
        this.visibleIds.add(id);
        this.filterWorkerService.setVisible(type, this.visibleIds);
    }

    deleteVisibleId(type: FilterObjectName, id: string): void {
        this.visibleIds.delete(id);
        this.filterWorkerService.setVisible(type, this.visibleIds);
    }

    /**
     * Initialize the list containing the components
     */
    initialize(type: FilterObjectName, componentQueryList: QueryList<TComponent>) {
        this.componentQueryList = componentQueryList;
        this.componentsObserver = new IntersectionObserver((entries, observer) => this.intersectionObserverCallback(type, entries, observer));
        this.subscriptions.push(
            this.componentQueryList.changes.subscribe(() => {
                this.triggerRender.next();
            }));
        this.subscriptions.push(this.triggerRender.pipe(throttleTime(50, undefined, { trailing: true })).subscribe(() => this.renderComponents()));
        this.triggerRender.next();
    }

    setModels(models: Map<string, TModel> | ReadonlyMap<string, TModel>) {
        this.models = models;
        this.triggerRender.next();
    }

    /**
     * Called by the intersection observer when components scroll in or out of the viewport
     */
    private intersectionObserverCallback(type: FilterObjectName, entries: IntersectionObserverEntry[], observer: IntersectionObserver): void {
        for (const entry of entries) {
            const id = (<HTMLElement>entry.target).dataset['id'];
            if (entry.isIntersecting) {
                // scrolled into view
                this.addVisibleId(type, id);
            } else {
                // scrolled out of view
                this.deleteVisibleId(type, id);
            }
        }

        this.renderVisibleComponents();
    }

    /**
     * Rendering the components and its highlights real-time whilst
     * the user is typing characters is SLOW. To make the user
     * experience much faster, render it incrementally:
     * - the matching components are rendered immediately (but empty!)
     * - their contents are set/updated in whenever they are scrolled
     *   into view. This way the visible hits are rendered straight
     *   away but hits further down the page wait.
     *   If the user quickly types a new character, only the visible
     *   set of components is re-rendered. This limits the amount
     *   of rendering to be done on each key press.
     *   The complete rendering of all the matches is only done
     *   if the user would scroll through the entire page.
     */
    private renderComponents(): void {
        if (!this.components) {
            return;
        }

        for (const component of this.componentQueryList) {
            this.componentsObserver.observe(component.nativeElement);
            component.loading = true;
        }

        this.renderVisibleComponents();
    }

    private renderVisibleComponents() {
        const renderQueue: TComponent[] = [];
        for (const component of this.visibleComponents()) {
            if (component?.loading) {
                renderQueue.push(component);
            }
        }

        if (renderQueue.length === 0) { return; }
        this.ngZone.run(() => {
            for (const component of renderQueue) {
                component.model = this.models.get(component.id);
                component.loading = false;
            }
        });
    }
}
