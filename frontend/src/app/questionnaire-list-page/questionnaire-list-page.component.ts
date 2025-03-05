import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { DialectLookup, EndDialects } from '../models/dialect';
import { Question, MatchedQuestion } from '../models/question';
import { State } from '../questionnaire.state';
import { QuestionnaireService } from '../services/questionnaire.service';
import { loadQuestionnaire, setIncludingFilter, setExcludingFilter } from '../questionnaire.actions';
import { FilterEvent as FilterEventData } from '../questionnaire-item/questionnaire-item.component';
import { DialectService } from '../services/dialect.service';
import { ProgressService, ProgressSession } from '../services/progress.service';
import { FilterManagementService } from '../services/filter-management.service';
import { ManualButtonComponent } from '../manual-button/manual-button.component';
import { DownloadButtonComponent } from '../download-button/download-button.component';
import { QuestionnaireListComponent } from '../questionnaire-list/questionnaire-list.component';
import { TransitionNumbersPipe } from '../transition-numbers.pipe';
import { QuestionnaireFiltersComponent } from "../questionnaire-filters/questionnaire-filters.component";
import { DialectTreeComponent } from '../dialect-tree/dialect-tree.component';

@Component({
    selector: 'mima-questionnaire-list-page',
    templateUrl: './questionnaire-list-page.component.html',
    styleUrls: ['./questionnaire-list-page.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        DialectTreeComponent,
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

    public dialectLookup: DialectLookup;

    @Input() filterSelect: Map<string, string[]>;

    matchedQuestions: ReadonlyMap<string, MatchedQuestion>;
    matchedAnswerCount = 0;
    matchedDialects = new Set<string>();
    matchedRootDialects = new Set<string>();
    matchedParticipants = new Set<string>();

    listMatchedDialects = false;

    questions: ReadonlyMap<string, Question>;
    endDialects: EndDialects;
    dialects: string[] = [];

    participantIds: string[];
    progress: ProgressSession;

    constructor(private questionnaireService: QuestionnaireService, private dialectService: DialectService, private filterManagementService: FilterManagementService, private store: Store<State>, private progressService: ProgressService) {
        this.progress = this.progressService.start(true);
    }

    ngOnInit() {
        this.store.dispatch(loadQuestionnaire());
        this.dialectLookup = this.dialectService.dialectLookup;
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
                        this.endDialects = this.dialectService.determineParticipantEndDialects(answers, this.dialectLookup);
                        this.participantIds = participants.map(p => p.participantId);
                    }
                }
            }),
            // Fires when matchedQuestions are changed
            this.matchedQuestions$.subscribe(questions => {
                this.matchedQuestions = questions;

                this.matchedAnswerCount = 0;
                const matchedDialects: string[] = [];
                this.matchedParticipants = new Set<string>();
                for (const question of this.matchedQuestions.values()) {
                    this.matchedAnswerCount += question.matchedAnswerCount;
                    for (const dialect of question.matchedDialectNames) {
                        matchedDialects.push(dialect);
                    }
                    for (const participantId of question.matchedParticipants) {
                        this.matchedParticipants.add(participantId);
                    }
                }

                this.matchedDialects = new Set<string>(matchedDialects);
                this.matchedRootDialects = this.dialectLookup.getRootDialects(this.matchedDialects);
            })
        ];
    }

    ngOnDestroy(): void {
        this.progress.hide();
        for (const subscription of this.subscriptions) {
            subscription.unsubscribe();
        }
    }

    onIncludeFilter(filterData: FilterEventData) {
        if (filterData.field === 'dialects') {
            const content = [filterData.content, ...this.dialectService.getAllSubDialects(filterData.content)];
            this.store.dispatch(setIncludingFilter({
                ...filterData,
                content
            }));
        } else {
            this.store.dispatch(setIncludingFilter({
                ...filterData,
                content: [filterData.content]
            }));
        }
    }

    onExcludeFilter(filterData: FilterEventData) {
        let include: string[];
        let exclude = [filterData.content];
        switch (filterData.field) {
            case 'id':
                include = [... this.questions.keys()];
                break;

            case 'dialects':
                include = this.dialects;
                // removes all the sub dialects as well
                exclude = [filterData.content, ...this.dialectService.getAllSubDialects(filterData.content)];
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
            exclude,
            include
        }));
    }
}
