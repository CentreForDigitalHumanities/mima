import { Component, NgZone, Input } from '@angular/core';
import { LikertListComponent } from '../likert-list/likert-list.component';
import { JudgmentsService } from '../services/judgments.service';
import { FilterManagementService } from '../services/filter-management.service';
import { Store } from '@ngrx/store';
import { State } from '../judgments.state';
import { ProgressService } from '../services/progress.service';
import { Subscription } from 'rxjs';
import { loadJudgments } from '../judgments.actions';
import { Judgment, MatchedJudgment } from '../models/judgment';

@Component({
    selector: 'mima-likert-list-page',
    standalone: true,
    imports: [LikertListComponent],
    templateUrl: './likert-list-page.component.html',
    styleUrl: './likert-list-page.component.scss'
})
export class LikertListPageComponent {
    private subscriptions: Subscription[];
    private judgments$ = this.store.select('judgments', 'judgments');
    private matchedJudgments$ = this.store.select('judgments', 'matchedJudgments');

    @Input() filterSelect: Map<string, string[]>;

    constructor(private judgmentsService: JudgmentsService, private filterManagementService: FilterManagementService, private store: Store<State>, private progressService: ProgressService, private ngZone: NgZone) {
    }

    judgments: ReadonlyMap<string, Judgment>;
    matchedJudgments: ReadonlyMap<string, MatchedJudgment>;
    matchedAnswerCount = 0;
    matchedDialects = new Set<string>();
    matchedParticipants = new Set<string>();

    ngOnInit() {
        const progress = this.progressService.start(true);

        this.store.dispatch(loadJudgments());
        this.subscriptions = [
            // Fires when a new questionnaire dataset is loaded
            this.judgments$.subscribe(judgments => {
                if (judgments) {
                    if (judgments.size) {
                        progress.complete();
                        this.judgments = judgments;
                        // const answers = [...this.judgmentsService.getAnswers(this.judgments.values())];
                        // this.dialects = [...this.judgmentsService.getDialects(answers)];
                        // this.participantIds = this.judgmentsService.getParticipants(answers).map(p => p.participantId);
                    }
                }
            }),
            this.matchedJudgments$.subscribe(judgments => {
                this.matchedJudgments = judgments;

                this.matchedAnswerCount = 0;
                this.matchedDialects = new Set<string>();
                this.matchedParticipants = new Set<string>();
                // for (const question of this.matchedJudgments.values()) {
                //     this.matchedAnswerCount += question.matchedAnswerCount;
                //     for (const dialect of question.matchedDialectNames) {
                //         this.matchedDialects.add(dialect);
                //     }
                //     for (const participantId of question.matchedParticipants) {
                //         this.matchedParticipants.add(participantId);
                //     }
                // }
            })]
    }

    ngOnDestroy(): void {
        for (const subscription of this.subscriptions) {
            subscription.unsubscribe();
        }
    }

}
