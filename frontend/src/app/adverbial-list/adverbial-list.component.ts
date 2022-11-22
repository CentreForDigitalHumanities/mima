import { AfterViewInit, Component, OnDestroy, OnInit, QueryList, ViewChildren } from '@angular/core';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';
import { State } from '../adverbial.state';
import { AdverbialComponent } from '../adverbial/adverbial.component';
import { MatchedAdverbial } from '../models/adverbial';

const renderSteps = 10;
const renderInterval = 100;
@Component({
    selector: 'mima-adverbial-list',
    templateUrl: './adverbial-list.component.html',
    styleUrls: ['./adverbial-list.component.scss']
})
export class AdverbialListComponent implements OnInit, OnDestroy, AfterViewInit {
    private subscriptions: Subscription[];
    private matchedAdverbials$ = this.store.select('adverbials', 'matchedAdverbials');
    private matchedAdverbialIds$ = this.store.select('adverbials', 'matchedAdverbialIds');

    private renderIndex = 0;

    @ViewChildren(AdverbialComponent)
    adverbialComponents!: QueryList<AdverbialComponent>;

    renderTimeout: ReturnType<typeof setInterval>;

    matchedAdverbials: ReadonlyMap<string, MatchedAdverbial>;
    matchedAdverbialIds = new Set<string>();
    adverbialIds$ = this.store.select('adverbials', 'adverbialIds');

    constructor(private store: Store<State>) {
    }

    ngOnInit(): void {
        this.subscriptions = [
            this.matchedAdverbialIds$.pipe(
                withLatestFrom(this.matchedAdverbials$)
            ).subscribe(([ids, adverbials]) => {
                this.matchedAdverbials = adverbials;
                this.matchedAdverbialIds = new Set<string>(ids);
                this.renderAdverbials();
            })
        ];
    }

    ngAfterViewInit(): void {
        this.renderAdverbials();
        this.subscriptions.push(
            this.adverbialComponents.changes.subscribe((r) => {
                this.renderAdverbials();
            }));
    }

    ngOnDestroy(): void {
        for (const subscription of this.subscriptions) {
            subscription.unsubscribe();
        }
        if (this.renderTimeout) {
            clearTimeout(this.renderTimeout);
        }
    }

    /**
     * Rendering the adverbials and its highlights real-time whilst
     * the user is typing characters is SLOW. To make the user
     * experience much faster, render it incrementally:
     * - the matching components are rendered immediately (but empty!)
     * - their contents are set/updated in batches which are spread
     *   out over time. This way the first few (visible) hits are
     *   rendered straight away but hits further down the page wait.
     *   If the user quickly types a new character, only this small
     *   set of components for each batch is re-rendered. This limits
     *   the amount of rendering to be done on each key press.
     *   The complete rendering of all the matches will then be done
     *   in the background, once the filter has stabilized.
     */
    renderAdverbials(): void {
        // start from the first item again
        this.renderIndex = 0;
        if (this.renderTimeout) {
            return;
        }

        this.renderTimeout = setInterval(() => {
            let i = 0;
            while (i < renderSteps && this.renderIndex < this.matchedAdverbialIds.size) {
                const component = this.adverbialComponents.get(this.renderIndex);
                component.adverbial = this.matchedAdverbials[component.id];
                i++;
                this.renderIndex++;
            }

            if (this.renderIndex >= this.matchedAdverbialIds.size) {
                clearInterval(this.renderTimeout);
                delete this.renderTimeout;
            }
        }, renderInterval);
    }
}
