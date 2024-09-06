import { AfterViewInit, Component, Input, NgZone, OnChanges, OnDestroy, QueryList, SimpleChanges, ViewChildren } from '@angular/core';
import { LikertComponent } from '../likert/likert.component';
import { Judgment, MatchedJudgment } from '../models/judgment';
import { Subject, Subscription, throttleTime } from 'rxjs';
import { JudgmentsService } from '../services/judgments.service';


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
    matchedJudgments: ReadonlyMap<string, MatchedJudgment>;

    /**
     * Tracks which judgments have become visible or hidden
     */
    private judgmentsObserver: IntersectionObserver;

    /**
     * A render should be triggered
     */
    private triggerRender = new Subject<void>();


    @ViewChildren(LikertComponent)
    judgmentComponents!: QueryList<LikertComponent>;

    constructor(private judgmentsService: JudgmentsService, private ngZone: NgZone) {
        this.judgmentsObserver = new IntersectionObserver((entries, observer) => this.intersectionObserverCallback(entries, observer));
        this.subscriptions = [this.triggerRender.pipe(throttleTime(50, undefined, { trailing: true })).subscribe(() => this.renderJudgments())];
    }

    ngAfterViewInit(): void {
        this.triggerRender.next();
        this.subscriptions.push(
            this.judgmentComponents.changes.subscribe(() => {
                this.triggerRender.next();
            }));
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.matchedJudgments && !changes.matchedJudgments.firstChange) {
            // when the list of results isn't changed, but the content of the
            // judgments themselves could still have been changed
            this.triggerRender.next();
        }
    }

    ngOnDestroy(): void {
        for (const subscription of this.subscriptions) {
            subscription.unsubscribe();
        }
    }

    /**
     * Called by the intersection observer when judgments scroll in or out of the viewport
     */
    private intersectionObserverCallback(entries: IntersectionObserverEntry[], observer: IntersectionObserver): void {
        for (const entry of entries) {
            const id = (<HTMLElement>entry.target).dataset['id'];
            if (entry.isIntersecting) {
                // scrolled into view
                this.judgmentsService.addVisibleId(id);
            } else {
                // scrolled out of view
                this.judgmentsService.deleteVisibleId(id);
            }
        }

        this.renderVisibleJudgments();
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
    private renderJudgments(): void {
        if (!this.judgmentComponents) {
            return;
        }

        for (const component of this.judgmentComponents) {
            this.judgmentsObserver.observe(component.nativeElement);
            component.loading = true;
        }

        this.renderVisibleJudgments();
    }

    private renderVisibleJudgments() {
        const renderQueue: LikertComponent[] = [];
        for (const component of this.judgmentsService.visibleComponents()) {
            if (component?.loading) {
                renderQueue.push(component);
            }
        }

        if (renderQueue.length === 0) { return; }
        this.ngZone.run(() => {
            for (const component of renderQueue) {
                component.judgment = this.matchedJudgments.get(component.id);
                component.loading = false;
            }
        });
    }
}
