import { AfterViewInit, Component, EventEmitter, Input, NgZone, OnDestroy, Output, QueryList, ViewChildren } from '@angular/core';
import { FilterEvent, QuestionnaireItemComponent } from '../questionnaire-item/questionnaire-item.component';
import { Subject, Subscription, throttleTime } from 'rxjs';
import { QuestionnaireService } from '../services/questionnaire.service';
import { MatchedQuestion, Question } from '../models/question';

@Component({
    selector: 'mima-questionnaire-list',
    standalone: true,
    imports: [QuestionnaireItemComponent],
    templateUrl: './questionnaire-list.component.html',
    styleUrl: './questionnaire-list.component.scss'
})
export class QuestionnaireListComponent implements AfterViewInit, OnDestroy {
    private subscriptions: Subscription[];
    /**
     * Tracks which questions have become visible or hidden
     */
    private questionsObserver: IntersectionObserver;

    /**
     * A render should be triggered
     */
    private triggerRender = new Subject<void>();

    @ViewChildren(QuestionnaireItemComponent)
    questionComponents!: QueryList<QuestionnaireItemComponent>;

    @Input()
    questions: Map<string, Question>;

    @Input()
    matchedQuestions: Map<string, MatchedQuestion> | ReadonlyMap<string, MatchedQuestion>;

    @Output()
    includeFilter = new EventEmitter<FilterEvent>();

    @Output()
    excludeFilter = new EventEmitter<FilterEvent>();

    constructor(private questionnaireService: QuestionnaireService, private ngZone: NgZone) {
        this.questionsObserver = new IntersectionObserver((entries, observer) => this.intersectionObserverCallback(entries, observer));
        this.subscriptions = [this.triggerRender.pipe(throttleTime(50)).subscribe(() => this.renderQuestions())];
    }

    ngAfterViewInit(): void {
        this.triggerRender.next();
        this.subscriptions.push(
            this.questionComponents.changes.subscribe(() => {
                this.triggerRender.next();
            }));
    }

    ngOnDestroy(): void {
        for (const subscription of this.subscriptions) {
            subscription.unsubscribe();
        }
    }

    /**
     * Called by the intersection observer when questions scroll in or out of the viewport
     */
    private intersectionObserverCallback(entries: IntersectionObserverEntry[], observer: IntersectionObserver): void {
        for (const entry of entries) {
            const id = (<HTMLElement>entry.target).dataset['id'];
            if (entry.isIntersecting) {
                // scrolled into view
                this.questionnaireService.visibleQuestionIds.add(id);
            } else {
                // scrolled out of view
                this.questionnaireService.visibleQuestionIds.delete(id);
            }
        }

        this.renderVisibleQuestions();
    }

    /**
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
    private renderQuestions(): void {
        if (!this.questionComponents) {
            return;
        }

        for (const component of this.questionComponents) {
            this.questionsObserver.observe(component.nativeElement);
            component.loading = true;
        }

        this.renderVisibleQuestions();
    }

    private renderVisibleQuestions() {
        const renderQueue: QuestionnaireItemComponent[] = [];
        for (const component of this.questionnaireService.visibleComponents()) {
            if (component?.loading) {
                renderQueue.push(component);
            }
        }

        if (renderQueue.length === 0) { return; }
        this.ngZone.run(() => {
            for (const component of renderQueue) {
                component.question = this.matchedQuestions.get(component.id);
                component.loading = false;
            }
        });
    }

}
