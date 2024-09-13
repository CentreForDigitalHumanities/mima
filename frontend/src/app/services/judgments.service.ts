import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, lastValueFrom } from 'rxjs';
import { FilterService } from './filter.service';
import { CacheService } from './cache.service';
import { FilterWorkerService } from './filter-worker.service';
import { Judgment, MatchedJudgment as MatchedJudgment } from '../models/judgment';
import { LikertComponent } from '../likert/likert.component';
import { LikertResponse } from '../models/likert-response';
import { MatchedQuestion } from '../models/question';
import { VisibilityService } from './visibility.service';

@Injectable({
    providedIn: 'root'
})
export class JudgmentsService extends VisibilityService<LikertComponent, MatchedJudgment> implements OnDestroy {
    /**
     * Emits an updated list of matches
     */
    results$!: Observable<readonly (MatchedQuestion | MatchedJudgment)[]>;

    constructor(private http: HttpClient, filterWorkerService: FilterWorkerService, private filterService: FilterService, private cacheService: CacheService, ngZone: NgZone) {
        super(filterWorkerService, ngZone);
        this.subscriptions = [
            this.filterWorkerService.results$.subscribe((results => {
                this.updateVisible(results as Iterable<MatchedJudgment>)
            }))
        ];
        this.results$ = this.filterWorkerService.results$ as Observable<readonly MatchedQuestion[] | MatchedJudgment[]>;
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach(s => s.unsubscribe());
    }

    protected getId(model: MatchedJudgment): string {
        return model.judgmentId.text;
    }

    async save(items: Iterable<Judgment>): Promise<{ success: boolean }> {
        const data = [...items];
        // if it has already been loaded, override it
        this.filterWorkerService.setData(data);

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
        this.filterWorkerService.setData(judgments);
        return Promise.resolve(judgments);
    }

    /**
     *
     * @param response Object derived from a json file
     * @returns an Array of Judgment objects
     */
    convertToJudgments(response: Object) {
        const judgments: Judgment[] = [];
        for (const [tag, entry] of Object.entries(response)) {
            const responses: LikertResponse[] = [];
            for (const subentry of entry['responses']) {
                const response: LikertResponse = {
                    participantId: subentry['participant_id'],
                    dialect: subentry['dialect'],
                    score: subentry['score']
                }
                responses.push(response);
            }

            const judgment: Judgment = {
                judgmentId: entry['main_question_id'] + entry['sub_question_id'],
                mainQuestion: entry['main_question'],
                mainQuestionId: entry['main_question_id'],
                subQuestion: entry['sub_question'],
                subQuestionId: entry['sub_question_id'],
                responses: entry['responses'],
            };
            judgments.push(judgment);
        }
        return judgments
    }
}
