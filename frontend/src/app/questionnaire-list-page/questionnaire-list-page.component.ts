import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { Question, MatchedQuestion } from '../models/question';
import { State } from '../questionnaire.state';
import { QuestionnaireService } from '../services/questionnaire.service';
import { loadQuestionnaire, setIncludingFilter, setExcludingFilter } from '../questionnaire.actions';
import { FilterEvent as FilterEventData } from '../questionnaire-item/questionnaire-item.component';
import { ProgressService, ProgressSession } from '../services/progress.service';
import { FilterManagementService } from '../services/filter-management.service';
import { FilterListComponent } from '../filter-list/filter-list.component';
import { ManualButtonComponent } from '../manual-button/manual-button.component';
import { DownloadButtonComponent } from '../download-button/download-button.component';
import { QuestionnaireListComponent } from '../questionnaire-list/questionnaire-list.component';
import { TransitionNumbersPipe } from '../transition-numbers.pipe';
import { QuestionnaireFiltersComponent } from "../questionnaire-filters/questionnaire-filters.component";
import { Dialect, DialectLookup, EndDialects } from '../models/dialect';

@Component({
    selector: 'mima-questionnaire-list-page',
    templateUrl: './questionnaire-list-page.component.html',
    styleUrls: ['./questionnaire-list-page.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        FilterListComponent,
        ManualButtonComponent,
        DownloadButtonComponent,
        QuestionnaireListComponent,
        TransitionNumbersPipe,
        QuestionnaireFiltersComponent
    ]
})
export class QuestionnaireListPageComponent implements OnDestroy, OnInit {
    private subscriptions: Subscription[];
    private questions$ = this.store.select('questionnaire', 'questions');
    private matchedQuestions$ = this.store.select('questionnaire', 'matchedQuestions');
    private initDone: () => void;
    private initDonePromise = new Promise<void>((resolve) => {
        this.initDone = resolve;
    })

    public dialectLookup: DialectLookup;

    @Input() filterSelect: Map<string, string[]>;

    matchedQuestions: ReadonlyMap<string, MatchedQuestion>;
    matchedAnswerCount = 0;
    matchedDialects = new Set<string>();
    matchedParticipants = new Set<string>();

    listMatchedDialects = false;

    questions: ReadonlyMap<string, Question>;
    endDialects: EndDialects;
    dialects: string[] = [];

    participantIds: string[];
    progress: ProgressSession;

    constructor(private questionnaireService: QuestionnaireService, private filterManagementService: FilterManagementService, private store: Store<State>, private progressService: ProgressService) {
        this.progress = this.progressService.start(true);
    }

    async ngOnInit() {
        if (!this.questions) {
            this.store.dispatch(loadQuestionnaire());
        }
        this.dialectLookup = await this.questionnaireService.dialectLookup;
        this.subscriptions = [
            // Fires when a new questionnaire dataset is loaded
            this.questions$.subscribe(questions => {
                if (questions) {
                    if (questions.size) {
                        this.progress.complete();
                        this.questions = questions;
                        const answers = [...this.questionnaireService.getAnswers(this.questions.values())];
                        const participants = this.questionnaireService.getParticipants(answers);
                        this.dialects = [...this.questionnaireService.getDialects(answers)];
                        this.endDialects = this.questionnaireService.determineParticipantEndDialects(answers, this.dialectLookup);
                        this.participantIds = participants.map(p => p.participantId);
                    }
                }
            }),
            // Fires when matchedQuestions are changed
            this.matchedQuestions$.subscribe(questions => {
                this.matchedQuestions = questions;

                this.matchedAnswerCount = 0;
                this.matchedDialects = new Set<string>();
                this.matchedParticipants = new Set<string>();
                for (const question of this.matchedQuestions.values()) {
                    this.matchedAnswerCount += question.matchedAnswerCount;
                    for (const dialect of question.matchedDialectNames) {
                        this.matchedDialects.add(dialect);
                    }
                    for (const participantId of question.matchedParticipants) {
                        this.matchedParticipants.add(participantId);
                    }
                }
            })
        ];
        this.initDone();
    }

    async ngOnDestroy(): Promise<void> {
        this.progress.hide();
        await this.initDonePromise;
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

            case 'dialects':
                include = this.dialects;
                break;

            case 'participantId':
                include = this.participantIds;
                break;

            case 'attestation':
                include = ['attested', 'unattested'];
                break;

            default:
                include = this.filterManagementService.filterFieldOptions('question', filterData.field, this.questions).options.map(({ value }) => value);
                break;
        }
        this.store.dispatch(setExcludingFilter({
            ...filterData,
            exclude: filterData.content,
            include
        }));
    }
}
