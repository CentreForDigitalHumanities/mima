import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subscription, lastValueFrom } from 'rxjs';
import { MatchedQuestion, Question } from '../models/question';
import { Answer } from '../models/answer';
import { Participant } from '../models/participant';
import { Filter, FilterOperator } from '../models/filter';
import { FilterService } from './filter.service';
import { CacheService } from './cache.service';
import { QuestionnaireItemComponent } from '../questionnaire-item/questionnaire-item.component';
import { FilterWorkerService } from './filter-worker.service';
import { MatchedJudgment } from '../models/judgment';


@Injectable({
    providedIn: 'root'
})
export class QuestionnaireService implements OnDestroy {
    /**
     * components displaying questions, using the question ID as key
     */
    private components: { [id: string]: QuestionnaireItemComponent } = {};

    private visibleQuestionIds: Set<string> = new Set<string>();
    private subscriptions!: Subscription[];

    /**
     * Emits an updated list of matches
     */
    results$!: Observable<readonly MatchedQuestion[] | MatchedJudgment[]>;

    constructor(private http: HttpClient, private filterWorkerService: FilterWorkerService) {
        this.subscriptions = [
            this.filterWorkerService.results$.subscribe(results => { this.updateVisible(results as Iterable<MatchedQuestion>) })
        ];
        this.results$ = this.filterWorkerService.results$ as Observable<readonly MatchedQuestion[] | MatchedJudgment[]>;
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach(s => s.unsubscribe());
    }

    async save(items: Iterable<Question>): Promise<{ success: boolean }> {
        const data = [...items];
        // if it has already been loaded, override it
        this.filterWorkerService.setData(data);

        // async to allow modifying this method when saving it to an actual external database
        return Promise.resolve({ success: true });
    }

    /**
     * Reads the json file in assets
     * @returns a Promise of an Array of Question objects
     */
    async get(): Promise<ReadonlyArray<Question>> {
        const response = lastValueFrom(this.http.get('assets/cleaned_translation_questions.json'));

        const data = await response.then(res => res);
        const questionnaire = this.convertToQuestionnaire(data);
        this.filterWorkerService.setData(questionnaire);
        return Promise.resolve(questionnaire);
    }

    /**
     * Registers a question component so it can be updated directly during a search.
     */
    registerComponent(component: QuestionnaireItemComponent) {
        this.components[component.id] = component;
    }

    /**
     * Removes the registration for a component on clean-up.
     */
    unregisterComponent(component: QuestionnaireItemComponent) {
        delete this.components[component.id];
    }

    /**
     * Gets all the visible components
     */
    *visibleComponents(): Iterable<QuestionnaireItemComponent> {
        for (const questionId of this.visibleQuestionIds) {
            const component = this.components[questionId];
            if (component) {
                yield component;
            }
        }
    }

    addVisibleId(id: string): void {
        this.visibleQuestionIds.add(id);
        this.filterWorkerService.setVisible(this.visibleQuestionIds);
    }

    deleteVisibleId(id: string): void {
        this.visibleQuestionIds.delete(id);
        this.filterWorkerService.setVisible(this.visibleQuestionIds);
    }

    /**
     *
     * @param questionnaire Array of Question objects
     * @returns array of question IDs
     */
    getQuestionIds(questionnaire: ReadonlyArray<Question>) {
        const questionIds: string[] = [];
        for (let question of questionnaire) {
            questionIds.push(question.id);
        }
        return questionIds;
    }

    /**
     *
     * @param response Object derived from a json file
     * @returns an Array of Question objects
     */
    convertToQuestionnaire(response: Object) {
        const questions: Question[] = [];

        for (const [tag, entry] of Object.entries(response)) {
            const answers: Answer[] = [];
            for (const subentry of entry['answers']) {
                for (let example of subentry['answer'].split('|')) {
                    const answer: Answer = {
                        questionId: subentry['tag'],
                        answer: example,
                        answerId: '',
                        participantId: subentry['participant_id'],
                        dialect: subentry['dialect'],
                        attestation: 'attested'
                    }
                    if (example === 'unattested') {
                        answer.answer = ''
                        answer.attestation = 'unattested';
                    }
                    answers.push(answer);
                }
            }
            const question: Question = {
                id: entry['tag'],
                type: entry['type'],
                question: entry['question'],
                prompt: entry['prompt'],
                split_item: entry['split_item'],
                chapter: entry['chapter'],
                subtags: entry['subtags'],
                gloss: entry['gloss'],
                en_translation: entry['en_translation'],
                answers: answers
            };
            questions.push(question);
        }
        return questions;
    }

    *getAnswers(questions: Iterable<Question>): Iterable<Answer> {
        for (const question of questions) {
            if (!question.answers) {
                continue;
            }
            for (const answer of question.answers) {
                yield answer;
            }
        }
    }

    getDialects(answers: Iterable<Answer>): Set<string> {
        const dialects = new Set<string>();
        for (const answer of answers) {
            dialects.add(answer.dialect);
        }
        return dialects;
    }


    /**
     * Derives the participants from a Map containing answers
     * @param answers Map of a list of answers per dialect
     * @returns An array of Participant objects
     */
    getParticipants(answers: Iterable<Answer>): Participant[] {
        const participants: { [id: string]: Participant } = {};

        for (const answer of answers) {
            const participant: Participant = {
                participantId: answer.participantId,
                dialect: answer.dialect
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
    filter(filters: ReadonlyArray<Filter>, operator: FilterOperator): void {
        this.filterWorkerService.setFilters(filters, operator);
    }


    /**
     * Directly triggers the visible components to have their content updated.
     * @param matches results which should at least apply to all the visible questions
     */
    private updateVisible(matches: Iterable<MatchedQuestion>) {
        // make a copy, so we can remove all matching question IDs
        const visibleIds = [...this.visibleQuestionIds];
        for (const question of matches) {
            if (visibleIds.length === 0) {
                break;
            }

            const index = visibleIds.indexOf(question.id.text);
            if (index !== -1) {
                const [questionId] = visibleIds.splice(index, 1);
                const component = this.components[questionId];
                if (component) {
                    // immediately set the question to update rendering
                    component.question = question;
                }
            }
        }

        // these weren't in the matches, so we know they should be hidden
        for (const questionId of visibleIds) {
            const component = this.components[questionId];
            if (component) {
                component.question = undefined;
            }
        }
    }
}
