import { Store } from '@ngrx/store';
import { Subscription, filter, withLatestFrom } from 'rxjs';
import { Component, EventEmitter, Input, Output, QueryList, ViewChildren } from '@angular/core';
import { Question, MatchedQuestion } from '../models/question';
import { Answer } from '../models/answer';
import { Participant } from '../models/participant'
import { State } from '../questionnaire.state';
import { QuestionnaireService } from '../services/questionnaire.service';
import { SelectItem } from 'primeng/api';
import { loadQuestionnaire } from '../questionnaire.actions';
import { MatchedAdverbial } from '../models/adverbial';
import { QuestionnaireItemComponent } from '../questionnaire-item/questionnaire-item.component';

const renderSteps = 10; //potentially move these to settings
const renderInterval = 100;
@Component({
  selector: 'mima-questionnaire-list-page',
  templateUrl: './questionnaire-list-page.component.html',
  styleUrls: ['./questionnaire-list-page.component.scss']
})
export class QuestionnaireListPageComponent {
    private subscriptions: Subscription[];
    private questions$ = this.store.select('questionnaire', 'questions');
    questionIds$ = this.store.select('questionnaire', 'questionIds');
    private matchedQuestions$ = this.store.select('questionnaire', 'matchedQuestions')
    private matchedQuestionIds$ = this.store.select('questionnaire', 'matchedQuestionIds')

    @Input() filterSelect: Map<string, string[]>;

    matchedQuestions: ReadonlyMap<string, MatchedAdverbial|MatchedQuestion>;
    matchedQuestionIds = new Set<string>();

    private renderIndex = 0;

    renderTimeout: ReturnType<typeof setInterval>;


    @ViewChildren(QuestionnaireItemComponent)
    questionComponents!: QueryList<QuestionnaireItemComponent>;

    public isLoading = false;
    selectedOption: string;
    questionnaire: Question[] = [];
    questionIds: string[] = [];
    questions: Map<string,Question>;
    answers: Map<string, Answer[]> = new Map<string, Answer[]>();
    participants: Participant[] = [];
    dialects: string[] = [];
    dropdownOptions = new Map<string, SelectItem[]>([
        ['question', []],
        ['dialect', []],
        ['participant', []],
    ]);
    selectedFilters = new Map<string, string[]>(
        [['question', []],
        ['dialect', []],
        ['participant', []],]
    );
    singleFilters = new Map<string, string>();
    questionFilters: string[];
    dialectFilters: string[];
    participantFilters: string[];



    constructor(private questionnaireService: QuestionnaireService, private store: Store<State>) {
    }

    ngOnInit() {
        if (!this.questions) {
            this.store.dispatch(loadQuestionnaire());
        }
        this.subscriptions = [
            // Mees idea
            this.questions$.subscribe(questions => {
                if (questions) {
                    this.isLoading = true;
                    this.questions = questions;
                    this.load();
                }
            }),
            // Sheean idea
            this.matchedQuestionIds$.pipe(
                withLatestFrom(this.matchedQuestions$)
            ).subscribe(([ids, questions]) => {
                this.matchedQuestions = questions;
                this.matchedQuestionIds = new Set<string>(ids);
                this.renderQuestions();
            })
        ]

        this.changeOption('question');  // sets question as default filter option, might change later
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

        this.renderTimeout = setInterval(() => {
            let i = 0;
            while (i < renderSteps && this.renderIndex < this.matchedQuestionIds.size) {
                const component = this.questionComponents.get(this.renderIndex);
                component.question = this.matchedQuestions[component.id];
                i++;
                this.renderIndex++;
            }

            if (this.renderIndex >= this.matchedQuestionIds.size) {
                clearInterval(this.renderTimeout);
                delete this.renderTimeout;
            }
        }, renderInterval);
    }

    /**
     * implements the new filters and matches the question IDs selected.
     * @param filters the new filters, as provided by the p-multiselect component
     */
    filterChange(option: string, filters: string[]) {
        this.selectedFilters.set(option, filters);
        this.singleFilters.set(option, '');
        this.matchedQuestionIds = new Set();
        for (let id of this.questionIds) {
            if (this.selectedFilters.get('question').includes(id)) {
                this.matchedQuestionIds.add(id);
            }
        }
        this.selectedFilters = new Map(this.selectedFilters)
        switch(option) {  // temporary solution to make ngModel work on the dropdown, ideally we can get rid of the three separate filter arrays.
            case 'question': {
                this.questionFilters = this.selectedFilters.get('question')
            }
            case 'dialect': {
                this.dialectFilters = this.selectedFilters.get('dialect')
            }
            case 'participant': {
                this.participantFilters = this.selectedFilters.get('participant')
            }
        }

    }

    /**
     * loads the questionnaire and sets the variables accordingly.
     */
    private load() {
        this.questionIds = Array.from(this.questions.keys())
        // this.matchedQuestionIds = new Set(this.questionIds); // a temporary way to fill the matched questions set, get filtering in later
        this.answers = this.questionnaireService.convertToAnswersByDialect(Array.from(this.questions.values()));
        this.participants = this.questionnaireService.getParticipants(this.answers);
        if (this.dropdownOptions.get('question').length === 0) {  // TEMPORARY FIX, will refactor when processing PR
            this.setDropdownOptions();
        }
        this.initializeFilters();
        this.isLoading = false
    }

    changeOption(option: string) {
        this.selectedOption = option;
    }

    /**
     * sets the options for the dropdown filter, currently with:
     * - the question IDs and prompts
     * - the dialects (sorted)
     * - the participant IDs and dialects
     */
    setDropdownOptions() {
        for (const question of Array.from(this.questions.values())) {
            const item = question.id + ' ' + question.prompt;
            this.dropdownOptions.get('question').push({label: item, value: question.id});
        }

        for (const participant of this.participants) {
            const item = participant.participantId + ' ' + participant.dialect;
            this.dropdownOptions.get('participant').push({label: item, value: participant.participantId});
            if (!this.dialects.includes(participant.dialect)) {
                this.dropdownOptions.get('dialect').push({label: participant.dialect, value: participant.dialect});
                this.dialects.push(participant.dialect);
            }
        }
        this.dropdownOptions.get('dialect').sort((a,b) => a.label < b.label ? -1 : 1)
    }

    /**
     * Initializes the respective filters to have all options selected by default.
     */
    initializeFilters() {
        this.questionFilters = this.dropdownOptions.get('question').map(option => option.value);
        this.dialectFilters = this.dropdownOptions.get('dialect').map(option => option.value);
        this.participantFilters = this.dropdownOptions.get('participant').map(option => option.value);
        this.selectedFilters = new Map<string, string[]>([
            ['question', this.questionFilters],
            ['dialect', this.dialectFilters],
            ['participant', this.participantFilters]
        ]);
        this.singleFilters = new Map<string, string>([
            ['question', ''],
            ['dialect', ''],
            ['participant', '']
        ])
    }

    onSingleFilterSelect(filterData: [string, string]) {
        this.filterChange(filterData[0], [filterData[1]]);
        this.singleFilters.set(filterData[0], filterData[1]);
    }

    onExcludeFilter(filterData: [string, string]) {
        let updatedFilters = this.selectedFilters.get(filterData[0]).filter(element => element !== filterData[1]);
        this.filterChange(filterData[0], updatedFilters);
    }
}
