import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, lastValueFrom } from 'rxjs';
import { FilterWorkerService } from './filter-worker.service';
import { Judgment, MatchedJudgment as MatchedJudgment } from '../models/judgment';
import { LikertComponent } from '../likert/likert.component';
import { LikertResponse } from '../models/likert-response';
import { VisibilityService } from './visibility.service';
import { Filter, FilterOperator } from '../models/filter';
import { Participant } from '../models/participant';

@Injectable({
    providedIn: 'root'
})
export class JudgmentsService extends VisibilityService<LikertComponent, MatchedJudgment> implements OnDestroy {
    /**
     * Emits an updated list of matches
     */
    results$!: Observable<readonly MatchedJudgment[]>;

    constructor(private http: HttpClient, filterWorkerService: FilterWorkerService, ngZone: NgZone) {
        super(filterWorkerService, ngZone);
        this.results$ = this.filterWorkerService.results$.judgment;
        this.subscriptions = [
            this.results$.subscribe((results => { this.updateVisible(results); }))
        ];
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach(s => s.unsubscribe());
    }

    protected getId(model: MatchedJudgment): string {
        return model.judgmentId?.text;
    }

    async save(items: Iterable<Judgment>): Promise<{ success: boolean }> {
        const data = [...items];
        // if it has already been loaded, override it
        this.filterWorkerService.setData('judgment', data);

        // async to allow modifying this method when saving it to an actual external database
        return Promise.resolve({ success: true });
    }

    /**
     * Reads the json file in assets
     * @returns a Promise of an Array of Judgment objects
     */
    async get(): Promise<ReadonlyArray<Judgment>> {
        const response = lastValueFrom(this.http.get('assets/likert_scales_test.json'));
        const data = await response.then(res => res);
        const judgments = this.convertToJudgments(data);
        this.filterWorkerService.setData('judgment', judgments);
        return Promise.resolve(judgments);
    }

    /**
     *
     * @param response Object derived from a json file
     * @returns an Array of Judgment objects
     */
    convertToJudgments(response: Object) {
        const judgments: Judgment[] = [];
        for (const [, entry] of Object.entries(response)) {
            const responses: LikertResponse[] = [];
            for (const subentry of entry['responses']) {
                const response: LikertResponse = {
                    participantId: subentry['participant_id'],
                    dialects: subentry['dialects'],
                    score: subentry['score']
                }
                responses.push(response);
            }

            const judgment: Judgment = {
                judgmentId: entry['main_question_id'] + entry['sub_question_id'],
                mainQuestion: entry['main_question'],
                mainQuestionId: entry['main_question_id'],
                subQuestion: entry['sub_question'],
                subQuestionTextId: entry['sub_question_text_id'],
                responses,
            };
            judgments.push(judgment);
        }

        return judgments
    }

    /**
     * Derives the participants from a Map containing answers
     * @param responses Map of a list of answers per dialect
     * @returns An array of Participant objects
     */
    getParticipants(responses: Iterable<LikertResponse>): Participant[] {
        const participants: { [id: string]: Participant } = {};

        for (const response of responses) {
            const participant: Participant = {
                participantId: response.participantId,
                dialects: response.dialects
            };

            participants[participant.participantId] = participant;
        }

        return Object.values(participants);
    }

    /**
     * Searches the database for matching questions.
     * @param filters filters to apply
     * @param operator conjunction operator to use
     */
    filter(filters: ReadonlyArray<Filter<'judgment'>>, operator: FilterOperator): void {
        this.filterWorkerService.setFilters('judgment', filters, operator);
    }
}
