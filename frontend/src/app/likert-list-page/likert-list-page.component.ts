import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { State } from '../judgments.state';
import { ProgressService, ProgressSession } from '../services/progress.service';
import { loadJudgments, toggleShow } from '../judgments.actions';
import { Judgment, MatchedJudgment } from '../models/judgment';
import { LikertListComponent } from '../likert-list/likert-list.component';
import { LikertFiltersComponent } from '../likert-filters/likert-filters.component';
import { ManualButtonComponent } from '../manual-button/manual-button.component';
import { TransitionNumbersPipe } from '../transition-numbers.pipe';
import { LikertCountToggleComponent } from '../likert-count-toggle/likert-count-toggle.component';
import { DialectService } from '../services/dialect.service';
import { DialectLookup, EndDialects } from '../models/dialect';
import { JudgmentsService } from '../services/judgments.service';
import { Participant } from '../models/participant';

@Component({
    selector: 'mima-likert-list-page',
    standalone: true,
    imports: [CommonModule, LikertListComponent, LikertFiltersComponent, ManualButtonComponent, LikertCountToggleComponent, TransitionNumbersPipe],
    templateUrl: './likert-list-page.component.html',
    styleUrl: './likert-list-page.component.scss'
})
export class LikertListPageComponent implements OnInit, OnDestroy {
    private subscriptions: Subscription[];
    private judgments$ = this.store.select('judgments', 'judgments');
    private matchedJudgments$ = this.store.select('judgments', 'matchedJudgments');

    show$ = this.store.select('judgments', 'show');
    public dialectLookup: DialectLookup;


    progress: ProgressSession;

    @Input() filterSelect: Map<string, string[]>;

    constructor(private store: Store<State>, private progressService: ProgressService, private dialectService: DialectService, private judgmentsService: JudgmentsService) {
        this.progress = this.progressService.start(true);
    }

    judgments: ReadonlyMap<string, Judgment>;
    endDialects: EndDialects;
    matchedJudgments: ReadonlyMap<string, MatchedJudgment>;
    matchedResponseCount = 0;
    matchedDialects = new Set<string>();
    matchedParticipants = new Set<string>();

    ngOnInit() {
        this.store.dispatch(loadJudgments());
        this.dialectLookup = this.dialectService.dialectLookup;
        this.subscriptions = [
            // Fires when a new questionnaire dataset is loaded
            this.judgments$.subscribe(judgments => {
                if (judgments) {
                    if (judgments.size) {
                        this.progress.complete();
                        this.judgments = judgments;
                        const participants = [...this.getParticipants(judgments.values())];
                        this.endDialects = this.dialectService.determineParticipantEndDialects(participants, this.dialectLookup);
                    }
                }
            }),
            this.matchedJudgments$.subscribe(judgments => {
                this.matchedJudgments = judgments;

                this.matchedResponseCount = 0;
                this.matchedDialects = new Set<string>();
                this.matchedParticipants = new Set<string>();
                for (const judgment of this.matchedJudgments.values()) {
                    this.matchedResponseCount += judgment.matchedResponseCount;
                    for (const dialect of judgment.matchedDialectNames) {
                        this.matchedDialects.add(dialect);
                    }
                    for (const participantId of judgment.matchedParticipants) {
                        this.matchedParticipants.add(participantId);
                    }
                }
            })]
    }

    ngOnDestroy(): void {
        this.progress.hide();

        for (const subscription of this.subscriptions) {
            subscription.unsubscribe();
        }
    }

    toggleShow() {
        this.store.dispatch(toggleShow({}));
    }

    /**
     * Gets all the unique participants
     */
    private *getParticipants(judgments: Iterable<Judgment>): Iterable<Participant> {
        const seenParticipants = new Set<string>();
        for (const judgment of judgments) {
            for (const participant of this.judgmentsService.getParticipants(judgment.responses)) {
                if (!seenParticipants.has(participant.participantId)) {
                    seenParticipants.add(participant.participantId);
                    yield participant;
                }
            }
        }
    }

}
