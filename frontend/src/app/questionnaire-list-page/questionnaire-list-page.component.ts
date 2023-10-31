import { Store } from '@ngrx/store';
import { Subscription, filter, withLatestFrom } from 'rxjs';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Question } from '../models/question';
import { Answer } from '../models/answer';
import { Participant } from '../models/participant'
import { State } from '../questionnaire.state';
import { QuestionnaireService } from '../services/questionnaire.service';
import { SelectItem } from 'primeng/api';
import { loadQuestionnaire } from '../questionnaire.actions';


@Component({
  selector: 'mima-questionnaire-list-page',
  templateUrl: './questionnaire-list-page.component.html',
  styleUrls: ['./questionnaire-list-page.component.scss']
})
export class QuestionnaireListPageComponent {
    private subscriptions: Subscription[];
    private questions$ = this.store.select('questionnaire', 'questions');
    private questionIds$ = this.store.select('questionnaire', 'questionIds');

    @Input() filterSelect: Map<string, string[]>;


    public isLoading = false;
    selectedOption: string;
    questionnaire: Question[] = [];
    questionIds: string[] = [];
    questions: Map<string,Question>;
    matchedQuestionIds: string[] = [];
    answers: Map<string, Answer[]> = new Map<string, Answer[]>();
    participants: Participant[] = [];
    dialects: string[] = [];
    dropdownOptions = new Map<string, SelectItem[]>([
        ['question', []],
        ['dialect', []],
        ['participant', []],
    ]);
    selectedFilters = new Map<string, string[]>();
    questionFilters: string[];
    dialectFilters: string[];
    participantFilters: string[];
    singleFilters = new Map<string, string>([
        ['question', ''],
        ['dialect', ''],
        ['participant', '']
    ]);

    constructor(private questionnaireService: QuestionnaireService, private store: Store<State>) {
    }

    ngOnInit() {
        if (!this.questions) {
            this.store.dispatch(loadQuestionnaire());
        }
        this.questions$.subscribe(questions => {
            if (questions) {
                this.isLoading = true;
                this.questions = questions;
                this.load();
            }
        })
        this.changeOption('question');  // sets question as default filter option, might change later
    }

    /**
     * implements the new filters and matches the question IDs selected.
     * @param filters the new filters, as provided by the p-multiselect component
     */
    filterChange(option: string, filters: string[]) {
        this.selectedFilters.set(option, filters);
        this.singleFilters.set(option, '');
        this.matchedQuestionIds = [];
        for (let id of this.questionIds) {
            if (this.selectedFilters.get('question').includes(id)) {
                this.matchedQuestionIds.push(id);
            }
        }
        this.selectedFilters = new Map(this.selectedFilters)

    }

    /**
     * loads the questionnaire and sets the variables accordingly.
     */
    private load() {
        this.questionIds = Array.from(this.questions.keys())
        this.matchedQuestionIds = this.questionIds; // obviously temporary, get filtering in later
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
