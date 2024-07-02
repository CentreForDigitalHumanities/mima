import { AfterViewInit, Component, Input, NgZone, OnChanges, OnDestroy, QueryList, SimpleChanges, ViewChildren } from '@angular/core';
import { LikertComponent } from '../likert/likert.component';
import { Judgement, MatchedJudgement } from '../models/judgement';
import { Subject, Subscription, throttleTime } from 'rxjs';
import { JudgementsService } from '../services/judgements.service';


@Component({
  selector: 'mima-likert-list',
  standalone: true,
  imports: [LikertComponent],
  templateUrl: './likert-list.component.html',
  styleUrl: './likert-list.component.scss'
})
export class LikertListComponent implements AfterViewInit, OnChanges, OnDestroy {
    private subscriptions: Subscription[];

    @Input()
    matchedJudgements: ReadonlyMap<string, MatchedJudgement>;

    /**
     * Tracks which judgements have become visible or hidden
     */
    private judgementsObserver: IntersectionObserver;

    /**
     * A render should be triggered
     */
    private triggerRender = new Subject<void>();


    @ViewChildren(LikertComponent)
    judgementComponents!: QueryList<LikertComponent>;

    constructor(private judgementsService: JudgementsService, private ngZone: NgZone) {
        this.judgementsObserver = new IntersectionObserver((entries, observer) => this.intersectionObserverCallback(entries, observer));
        this.subscriptions = [this.triggerRender.pipe(throttleTime(50, undefined, { trailing: true })).subscribe(() => this.renderJudgements())];
    }

    ngAfterViewInit(): void {
        this.triggerRender.next();
        this.subscriptions.push(
            this.judgementComponents.changes.subscribe(() => {
                this.triggerRender.next();
            }));
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.matchedJudgements && !changes.matchedJudgements.firstChange) {
            // when the list of results isn't changed, but the content of the
            // judgements themselves could still have been changed
            this.triggerRender.next();
        }
    }

    ngOnDestroy(): void {
        for (const subscription of this.subscriptions) {
            subscription.unsubscribe();
        }
    }

    /**
     * Called by the intersection observer when judgements scroll in or out of the viewport
     */
    private intersectionObserverCallback(entries: IntersectionObserverEntry[], observer: IntersectionObserver): void {
        for (const entry of entries) {
            const id = (<HTMLElement>entry.target).dataset['id'];
            if (entry.isIntersecting) {
                // scrolled into view
                this.judgementsService.addVisibleId(id);
            } else {
                // scrolled out of view
                this.judgementsService.deleteVisibleId(id);
            }
        }

        this.renderVisibleJudgements();
    }

    /**
     * COPY FROM QUESTIONNAIRE ITEM COMPONENT
     * Rendering the adverbials and its highlights real-time whilst
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
    private renderJudgements(): void {
        if (!this.judgementComponents) {
            return;
        }

        for (const component of this.judgementComponents) {
            this.judgementsObserver.observe(component.nativeElement);
            component.loading = true;
        }

        this.renderVisibleJudgements();
    }

    private renderVisibleJudgements() {
        const renderQueue: LikertComponent[] = [];
        for (const component of this.judgementsService.visibleComponents()) {
            if (component?.loading) {
                renderQueue.push(component);
            }
        }

        if (renderQueue.length === 0) { return; }
        this.ngZone.run(() => {
            for (const component of renderQueue) {
                component.judgement = this.matchedJudgements.get(component.id);
                component.loading = false;
            }
        });
    }
}
