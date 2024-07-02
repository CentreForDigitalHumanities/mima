import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subscription, lastValueFrom } from 'rxjs';
import { Answer } from '../models/answer';
import { Participant } from '../models/participant';
import { Filter, FilterOperator } from '../models/filter';
import { FilterService } from './filter.service';
import { CacheService } from './cache.service';
import { FilterWorkerService } from './filter-worker.service';
import { Judgement, MatchedJudgement } from '../models/judgement';
import { LikertComponent } from '../likert/likert.component';
import { LikertResponse } from '../models/likert-response';
import { MatchedQuestion } from '../models/question';



@Injectable({
  providedIn: 'root'
})
export class JudgementsService implements OnDestroy {
    /**
     * components displaying judgements, using the judgement ID as key
     */
    private components: { [id: string]: LikertComponent } = {};

    private visibleJudgementIds: Set<string> = new Set<string>();
    private subscriptions!: Subscription[];

    /**
     * Emits an updated list of matches
     */
    results$!: Observable<readonly (MatchedQuestion | MatchedJudgement)[]>;

    constructor(private http: HttpClient, private filterWorkerService: FilterWorkerService, private filterService: FilterService, private cacheService: CacheService, private ngZone: NgZone) {
        this.subscriptions = [
            this.filterWorkerService.results$.subscribe((results => {
                this.updateVisible(results as Iterable<MatchedJudgement>)}))
        ];
        this.results$ = this.filterWorkerService.results$ as Observable<readonly MatchedQuestion[] | MatchedJudgement[]>;
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach(s => s.unsubscribe());
    }

    async save(items: Iterable<Judgement>): Promise<{ success: boolean }> {
        const data = [...items];
        // if it has already been loaded, override it
        this.filterWorkerService.setData(data);

        // async to allow modifying this method when saving it to an actual external database
        return Promise.resolve({ success: true });
    }

    /**
     * Reads the json file in assets
     * @returns a Promise of an Array of Judgement objects
     */
    async get(): Promise<ReadonlyArray<Judgement>> {
        const response = lastValueFrom(this.http.get('assets/likert_scales_test.json'));
        const data = await response.then(res => res);
        const judgements = this.convertToJudgements(data);
        this.filterWorkerService.setData(judgements);
        return Promise.resolve(judgements);
    }

    /**
     *
     * @param response Object derived from a json file
     * @returns an Array of Judgement objects
     */
    convertToJudgements(response: Object) {
        const judgements: Judgement[] = [];
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

            const judgement: Judgement = {
                judgementId: entry['main_question_id']+entry['sub_question_id'],
                mainQuestion: entry['main_question'],
                mainQuestionId: entry['main_question_id'],
                subQuestion: entry['sub_question'],
                subQuestionId: entry['sub_question_id'],
                responses: entry['responses'],
            };
            judgements.push(judgement);
        }
        return judgements
    }

    /**
     * Directly triggers the visible components to have their content updated.
     * @param matches results which should at least apply to all the visible judgements
     */
    private updateVisible(matches: Iterable<MatchedJudgement>) {
        // make a copy, so we can remove all matching judgement IDs
        const visibleIds = [...this.visibleJudgementIds];
        for (const judgement of matches) {
            if (visibleIds.length === 0) {
                break;
            }

            const index = visibleIds.indexOf(judgement.judgementId.text);
            if (index !== -1) {
                const [judgementId] = visibleIds.splice(index, 1);
                const component = this.components[judgementId];
                if (component) {
                    // immediately set the judgement to update rendering
                    component.matchedJudgement = judgement;
                }
            }
        }

        // these weren't in the matches, so we know they should be hidden
        for (const judgementId of visibleIds) {
            const component = this.components[judgementId];
            if (component) {
                component.matchedJudgement = undefined;
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
        for (const judgementId of this.visibleJudgementIds) {
            const component = this.components[judgementId];
            if (component) {
                yield component;
            }
        }
    }

    addVisibleId(id: string): void {
        this.visibleJudgementIds.add(id);
        this.filterWorkerService.setVisible(this.visibleJudgementIds);
    }

    deleteVisibleId(id: string): void {
        this.visibleJudgementIds.delete(id);
        this.filterWorkerService.setVisible(this.visibleJudgementIds);
    }
}
