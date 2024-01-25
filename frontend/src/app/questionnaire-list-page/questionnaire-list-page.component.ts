import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';
import { AfterViewInit, Component, Input, OnDestroy, OnInit, QueryList, ViewChildren } from '@angular/core';
import { Question, MatchedQuestion } from '../models/question';
import { State } from '../questionnaire.state';
import { QuestionnaireService } from '../services/questionnaire.service';
import { loadQuestionnaire, setIncludingFilter, setExcludingFilter } from '../questionnaire.actions';
import { FilterEvent as FilterEventData, QuestionnaireItemComponent } from '../questionnaire-item/questionnaire-item.component';
import { ProgressService } from '../services/progress.service';

const renderSteps = 10; //potentially move these to settings
const renderInterval = 100;
@Component({
    selector: 'mima-questionnaire-list-page',
    templateUrl: './questionnaire-list-page.component.html',
    styleUrls: ['./questionnaire-list-page.component.scss']
})
export class QuestionnaireListPageComponent implements AfterViewInit, OnDestroy, OnInit {
    private subscriptions: Subscription[];
    private questions$ = this.store.select('questionnaire', 'questions');
    questionIds$ = this.store.select('questionnaire', 'questionIds');
    private matchedQuestions$ = this.store.select('questionnaire', 'matchedQuestions')
    private matchedQuestionIds$ = this.store.select('questionnaire', 'matchedQuestionIds')

    @Input() filterSelect: Map<string, string[]>;

    matchedQuestions: ReadonlyMap<string, MatchedQuestion>;
    matchedQuestionIds = new Set<string>();

    private renderIndex = 0;

    renderTimeout: ReturnType<typeof setInterval>;

    @ViewChildren(QuestionnaireItemComponent)
    questionComponents!: QueryList<QuestionnaireItemComponent>;

    public isLoading = false;
    selectedOption: string;
    questionnaire: Question[] = [];
    questionIds: string[] = [];
    questions: Map<string, Question>;
    dialects: string[] = [];

    participantIds: string[];

    constructor(private questionnaireService: QuestionnaireService, private progressService: ProgressService, private store: Store<State>) {
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
                this.renderQuestions();
            })
        ]
    }

    ngAfterViewInit(): void {
        this.renderQuestions();
        this.subscriptions.push(
            this.questionComponents.changes.subscribe((r) => {
                this.renderQuestions();
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
     * TAKEN FROM THE ADVERBIAL-LIST COMPONENT:
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
    renderQuestions(): void {
        // start from the first item again
        this.renderIndex = 0;
        if (this.renderTimeout) {
            return;
        }

        if (!this.questionComponents) {
            return;
        }

        let i = 0;
        for (const component of this.questionComponents) {
            if (i >= renderSteps) {
                // don't blur the first matched questions
                // they should be updated as quickly as possibly and not be blurred
                // this way updating a filter by e.g. typing appears to be smooth
                component.loading = true;
            }
            i++;
        }

        this.progressService.start();

        this.renderTimeout = setInterval(() => {
            let i = 0;
            while (i < renderSteps && this.renderIndex < this.matchedQuestionIds.size) {
                const component = this.questionComponents.get(this.renderIndex);
                component.question = this.matchedQuestions.get(component.id);
                component.loading = false;
                i++;
                this.renderIndex++;
                this.progressService.next(this.renderIndex, this.matchedQuestionIds.size);
            }

            if (this.renderIndex >= this.matchedQuestionIds.size) {
                clearInterval(this.renderTimeout);
                this.progressService.complete();
                delete this.renderTimeout;
            }
        }, renderInterval);
    }

    onIncludeFilter(filterData: FilterEventData) {
        this.progressService.indeterminate();
        this.store.dispatch(setIncludingFilter({
            ...filterData
        }));
    }

    onExcludeFilter(filterData: FilterEventData) {
        this.progressService.indeterminate();
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
        }
        this.store.dispatch(setExcludingFilter({
            ...filterData,
            exclude: filterData.content,
            include
        }));
    }
}
