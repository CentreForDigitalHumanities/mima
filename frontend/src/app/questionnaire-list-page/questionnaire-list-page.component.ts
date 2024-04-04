import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { Component, Input, NgZone, OnDestroy, OnInit } from '@angular/core';
import { Question, MatchedQuestion } from '../models/question';
import { State } from '../questionnaire.state';
import { QuestionnaireService } from '../services/questionnaire.service';
import { loadQuestionnaire, setIncludingFilter, setExcludingFilter } from '../questionnaire.actions';
import { FilterEvent as FilterEventData } from '../questionnaire-item/questionnaire-item.component';
import { ProgressService } from '../services/progress.service';
import { FilterManagementService } from '../services/filter-management.service';

@Component({
    selector: 'mima-questionnaire-list-page',
    templateUrl: './questionnaire-list-page.component.html',
    styleUrls: ['./questionnaire-list-page.component.scss']
})
export class QuestionnaireListPageComponent implements OnDestroy, OnInit {
    private subscriptions: Subscription[];
    private questions$ = this.store.select('questionnaire', 'questions');
    private matchedQuestions$ = this.store.select('questionnaire', 'matchedQuestions');

    @Input() filterSelect: Map<string, string[]>;

    matchedQuestions: ReadonlyMap<string, MatchedQuestion>;
    matchedAnswerCount = 0;
    matchedDialects = new Set<string>();

    loading = false;
    questions: Map<string, Question>;
    dialects: string[] = [];

    participantIds: string[];

    constructor(private questionnaireService: QuestionnaireService, private filterManagementService: FilterManagementService, private store: Store<State>, private progressService: ProgressService, private ngZone: NgZone) {
        this.progressService.indeterminate();
    }

    ngOnInit() {
        if (!this.questions) {
            this.store.dispatch(loadQuestionnaire());
        }
        this.subscriptions = [
            // Fires when a new questionnaire dataset is loaded
            this.questions$.subscribe(questions => {
                if (questions) {
                    if (questions.size) {
                        this.progressService.complete();
                        this.questions = questions;
                        const answers = [...this.questionnaireService.getAnswers(this.questions.values())];
                        this.dialects = [...this.questionnaireService.getDialects(answers)];
                        this.participantIds = this.questionnaireService.getParticipants(answers).map(p => p.participantId);
                    }
                }
            }),
            // Fires when matchedQuestions are changed
            this.matchedQuestions$.subscribe(questions => {
                this.matchedQuestions = questions;

                this.matchedAnswerCount = 0;
                this.matchedDialects = new Set<string>();
                for (const question of this.matchedQuestions.values()) {
                    this.matchedAnswerCount += question.matchedAnswerCount;
                    for (const dialect of question.matchedDialectNames) {
                        this.matchedDialects.add(dialect);
                    }
                }
            })
        ]
    }

    ngOnDestroy(): void {
        for (const subscription of this.subscriptions) {
            subscription.unsubscribe();
        }
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
                include = [... this.questions.keys()];
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

            default:
                include = this.filterManagementService.filterFieldOptions(filterData.field, this.questions).options.map(({ value }) => value);
                break;
        }
        this.store.dispatch(setExcludingFilter({
            ...filterData,
            exclude: filterData.content,
            include
        }));
    }
}
