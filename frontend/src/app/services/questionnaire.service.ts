import { Injectable, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { MatchedQuestion, Question } from '../models/question';
import { Answer } from '../models/answer';
import { Participant } from '../models/participant';
import { Filter, FilterOperator } from '../models/filter';
import { FilterService } from './filter.service';
import { Cache, CacheService } from './cache.service';
import { QuestionnaireItemComponent } from '../questionnaire-item/questionnaire-item.component';


@Injectable({
    providedIn: 'root'
})
export class QuestionnaireService {
    private cache: Cache<MatchedQuestion[]>;
    /**
     * components displaying questions, using the question ID as key
     */
    private components: { [id: string]: QuestionnaireItemComponent } = {};

    visibleQuestionIds: Set<string> = new Set<string>();
    private database: Promise<Question[]>;
    private loadData: (questions: Question[]) => void;

    constructor(private http: HttpClient, private filterService: FilterService, private cacheService: CacheService, private ngZone: NgZone) {
        this.cache = cacheService.init<MatchedQuestion[]>('questions');
        this.database = new Promise((resolve) => {
            this.loadData = resolve;
        });
    }

    async save(items: Iterable<Question>): Promise<{ success: boolean }> {
        const data = [...items];
        // resolves existing awaiters (if any)
        this.loadData(data);
        // if it has already been loaded, override it
        this.database = Promise.resolve(data);

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
        this.loadData(questionnaire);
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

    /**
     *
     * @param questionnaire Array of Question objects
     * @returns array of questiondIds
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
                        dialect: subentry['dialect']
                    }
                    answers.push(answer);
                }
            }
            const question: Question = {
                id: entry['tag'],
                type: entry['type'],
                question: entry['question'],
                prompt: entry['prompt'],
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
     * @returns the matching results
     */
    async filter(filters: ReadonlyArray<Filter>, operator: FilterOperator): Promise<Iterable<MatchedQuestion>> {
        const cacheKey = this.cacheService.key([filters, operator]);
        const cached = this.cache.get(cacheKey);
        if (cached !== undefined) {
            return cached;
        }

        // update visible questions first
        const { visible, other } = this.selectVisible(await this.database);
        let matches = visible
            .map(question => this.filterService.applyFilters(question, filters, operator))
            .filter(question => !!question);

        this.ngZone.run(() => {
            this.updateVisible(matches);
        });

        // filter remainder of the questions
        return new Promise((resolve) => {
            matches.push(...other
                .map(question => this.filterService.applyFilters(question, filters, operator))
                .filter(question => !!question));

            this.cache.set(cacheKey, matches);

            resolve(matches);
        });
    }

    /**
     * Selects the visible questions from the database.
     * @param questions questions database
     * @returns the questions which are visible, and the remainder
     */
    private selectVisible(questions: Question[]): {
        visible: Question[],
        other: Question[]
    } {
        const visible: Question[] = [];
        const other: Question[] = [];
        for (const question of questions) {
            if (this.visibleQuestionIds.has(question.id)) {
                visible.push(question);
            } else {
                other.push(question);
            }
        }

        return { visible, other };
    }

    /**
     * Directly triggers the visible components to have their content updated.
     * @param matches results which should at least apply to all the visible questions
     */
    private updateVisible(matches: MatchedQuestion[]) {
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
