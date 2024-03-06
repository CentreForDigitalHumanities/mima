import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';
import { AfterViewInit, Component, Input, NgZone, OnDestroy, OnInit, QueryList, ViewChildren } from '@angular/core';
import { Question, MatchedQuestion } from '../models/question';
import { State } from '../questionnaire.state';
import { QuestionnaireService } from '../services/questionnaire.service';
import { loadQuestionnaire, setIncludingFilter, setExcludingFilter } from '../questionnaire.actions';
import { FilterEvent as FilterEventData, QuestionnaireItemComponent } from '../questionnaire-item/questionnaire-item.component';

@Component({
    selector: 'mima-questionnaire-list-page',
    templateUrl: './questionnaire-list-page.component.html',
    styleUrls: ['./questionnaire-list-page.component.scss']
})
export class QuestionnaireListPageComponent implements AfterViewInit, OnDestroy, OnInit {
    private subscriptions: Subscription[];
    private questions$ = this.store.select('questionnaire', 'questions');
    questionIds$ = this.store.select('questionnaire', 'questionIds');
    private matchedQuestions$ = this.store.select('questionnaire', 'matchedQuestions');
    private matchedQuestionIds$ = this.store.select('questionnaire', 'matchedQuestionIds');
    /**
     * Tracks which questions have become visible or hidden
     */
    private questionsObserver: IntersectionObserver;

    @Input() filterSelect: Map<string, string[]>;

    matchedQuestions: ReadonlyMap<string, MatchedQuestion>;
    matchedQuestionIds = new Set<string>();
    matchedAnswerCount = 0;
    matchedDialects = new Set<string>();

    @ViewChildren(QuestionnaireItemComponent)
    questionComponents!: QueryList<QuestionnaireItemComponent>;

    public isLoading = false;
    selectedOption: string;
    questionnaire: Question[] = [];
    questionIds: string[] = [];
    questions: Map<string, Question>;
    dialects: string[] = [];

    participantIds: string[];

    constructor(private questionnaireService: QuestionnaireService, private store: Store<State>, private ngZone: NgZone) {
        this.questionsObserver = new IntersectionObserver((entries, observer) => this.intersectionObserverCallback(entries, observer));
    }

    ngOnInit() {
        if (!this.questions) {
            this.store.dispatch(loadQuestionnaire());
        }
        this.subscriptions = [
            // Fires when a new questionnaire dataset is loaded
            this.questions$.subscribe(questions => {
                if (questions) {
                    this.questions = questions;
                    this.questionIds = [...this.questions.keys()];
                    const answers = [...this.questionnaireService.getAnswers(this.questions.values())];
                    this.dialects = [...this.questionnaireService.getDialects(answers)];
                    this.participantIds = this.questionnaireService.getParticipants(answers).map(p => p.participantId);
                }
            }),
            // Fires when matchedQuestionIds are changed
            this.matchedQuestionIds$.pipe(
                withLatestFrom(this.matchedQuestions$)
            ).subscribe(([ids, questions]) => {
                this.matchedQuestions = questions;
                this.matchedQuestionIds = new Set<string>(ids);

                this.matchedAnswerCount = 0;
                this.matchedDialects = new Set<string>();
                for (const question of this.matchedQuestions.values()) {
                    this.matchedAnswerCount += question.matchedAnswerCount;
                    for (const dialect of question.matchedDialectNames) {
                        this.matchedDialects.add(dialect);
                    }
                }

                this.renderQuestions();
            })
        ]
    }

    ngAfterViewInit(): void {
        this.renderQuestions();
        this.subscriptions.push(
            this.questionComponents.changes.subscribe(() => {
                this.renderQuestions();
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
    renderQuestions(): void {
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

    onIncludeFilter(filterData: FilterEventData) {
        this.store.dispatch(setIncludingFilter({
            ...filterData
        }));
    }

    onExcludeFilter(filterData: FilterEventData) {
        let include: string[];
        switch (filterData.field) {
            case 'id':
                include = this.questionIds;
                break;

            case 'dialect':
                include = this.dialects;
                break;

            case 'participantId':
                include = this.participantIds;
                break;

            case 'attestation':
                include = ['attested', 'unattested'];
                break;
        }
        this.store.dispatch(setExcludingFilter({
            ...filterData,
            exclude: filterData.content,
            include
        }));
    }
}
