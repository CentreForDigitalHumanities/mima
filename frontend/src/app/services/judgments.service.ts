import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subscription, lastValueFrom } from 'rxjs';
import { Answer } from '../models/answer';
import { Participant } from '../models/participant';
import { Filter, FilterOperator } from '../models/filter';
import { FilterService } from './filter.service';
import { CacheService } from './cache.service';
import { FilterWorkerService } from './filter-worker.service';
import { Judgment, MatchedJudgment as MatchedJudgment } from '../models/judgment';
import { LikertComponent } from '../likert/likert.component';
import { LikertResponse } from '../models/likert-response';
import { MatchedQuestion } from '../models/question';



@Injectable({
  providedIn: 'root'
})
export class JudgmentsService implements OnDestroy {
    /**
     * components displaying judgments, using the judgment ID as key
     */
    private components: { [id: string]: LikertComponent } = {};

    private visibleJudgmentIds: Set<string> = new Set<string>();
    private subscriptions!: Subscription[];

    /**
     * Emits an updated list of matches
     */
    results$!: Observable<readonly (MatchedQuestion | MatchedJudgment)[]>;

    constructor(private http: HttpClient, private filterWorkerService: FilterWorkerService, private filterService: FilterService, private cacheService: CacheService, private ngZone: NgZone) {
        this.subscriptions = [
            this.filterWorkerService.results$.subscribe((results => {
                this.updateVisible(results as Iterable<MatchedJudgment>)}))
        ];
        this.results$ = this.filterWorkerService.results$ as Observable<readonly MatchedQuestion[] | MatchedJudgment[]>;
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach(s => s.unsubscribe());
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
                judgmentId: entry['main_question_id']+entry['sub_question_id'],
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

    /**
     * Directly triggers the visible components to have their content updated.
     * @param matches results which should at least apply to all the visible judgments
     */
    private updateVisible(matches: Iterable<MatchedJudgment>) {
        // make a copy, so we can remove all matching judgment IDs
        const visibleIds = [...this.visibleJudgmentIds];
        for (const judgment of matches) {
            if (visibleIds.length === 0) {
                break;
            }

            const index = visibleIds.indexOf(judgment.judgmentId.text);
            if (index !== -1) {
                const [judgmentId] = visibleIds.splice(index, 1);
                const component = this.components[judgmentId];
                if (component) {
                    // immediately set the judgment to update rendering
                    component.matchedJudgment = judgment;
                }
            }
        }

        // these weren't in the matches, so we know they should be hidden
        for (const judgmentId of visibleIds) {
            const component = this.components[judgmentId];
            if (component) {
                component.matchedJudgment = undefined;
            }
        }
    }

    registerComponent(component: LikertComponent) {
        this.components[component.id] = component;
    }

    /**
     * Removes the registration for a component on clean-up.
     */
    unregisterComponent(component: LikertComponent) {
        delete this.components[component.id];
    }

    /**
     * Gets all the visible components
     */
    *visibleComponents(): Iterable<LikertComponent> {
        for (const judgmentId of this.visibleJudgmentIds) {
            const component = this.components[judgmentId];
            if (component) {
                yield component;
            }
        }
    }

    addVisibleId(id: string): void {
        this.visibleJudgmentIds.add(id);
        this.filterWorkerService.setVisible(this.visibleJudgmentIds);
    }

    deleteVisibleId(id: string): void {
        this.visibleJudgmentIds.delete(id);
        this.filterWorkerService.setVisible(this.visibleJudgmentIds);
    }
}
