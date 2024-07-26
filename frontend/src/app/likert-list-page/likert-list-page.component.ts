import { Component, NgZone, Input } from '@angular/core';
import { LikertListComponent } from '../likert-list/likert-list.component';
import { JudgementsService } from '../services/judgements.service';
import { FilterManagementService } from '../services/filter-management.service';
import { Store } from '@ngrx/store';
import { State } from '../judgements.state';
import { ProgressService } from '../services/progress.service';
import { Subscription } from 'rxjs';
import { loadJudgements } from '../judgements.actions';
import { Judgement, MatchedJudgement } from '../models/judgement';

@Component({
  selector: 'mima-likert-list-page',
  standalone: true,
  imports: [LikertListComponent],
  templateUrl: './likert-list-page.component.html',
  styleUrl: './likert-list-page.component.scss'
})
export class LikertListPageComponent {
    private subscriptions: Subscription[];
    private judgements$ = this.store.select('judgements', 'judgements');
    private matchedJudgements$ = this.store.select('judgements', 'matchedJudgements');

    @Input() filterSelect: Map<string, string[]>;

    constructor(private judgementsService: JudgementsService, private filterManagementService: FilterManagementService, private store: Store<State>, private progressService: ProgressService, private ngZone: NgZone) {
        this.progressService.indeterminate();
    }

    judgements: Map<string, Judgement>;
    matchedJudgements: ReadonlyMap<string, MatchedJudgement>;
    matchedAnswerCount = 0;
    matchedDialects = new Set<string>();
    matchedParticipants = new Set<string>();

    ngOnInit() {
        if (!this.judgements) {
            this.store.dispatch(loadJudgements());
        }
        this.subscriptions = [
            // Fires when a new questionnaire dataset is loaded
            this.judgements$.subscribe(judgements => {
                if (judgements) {
                    if (judgements.size) {
                        this.progressService.complete();
                        this.judgements = judgements;
                        // const answers = [...this.judgementsService.getAnswers(this.judgements.values())];
                        // this.dialects = [...this.judgementsService.getDialects(answers)];
                        // this.participantIds = this.judgementsService.getParticipants(answers).map(p => p.participantId);
                    }
                }
            }),
            this.matchedJudgements$.subscribe(judgements => {
                this.matchedJudgements = judgements;

                this.matchedAnswerCount = 0;
                this.matchedDialects = new Set<string>();
                this.matchedParticipants = new Set<string>();
                // for (const question of this.matchedJudgements.values()) {
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
