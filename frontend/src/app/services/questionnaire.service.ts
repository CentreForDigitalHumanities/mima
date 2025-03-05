import { Injectable, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, lastValueFrom } from 'rxjs';
import { MatchedQuestion, Question } from '../models/question';
import { Answer } from '../models/answer';
import { Participant } from '../models/participant';
import { Filter, FilterOperator } from '../models/filter';
import { QuestionnaireItemComponent } from '../questionnaire-item/questionnaire-item.component';
import { FilterWorkerService } from './filter-worker.service';
import { VisibilityService } from './visibility.service';
import { DialectLookup, EndDialects } from '../models/dialect';


@Injectable({
    providedIn: 'root'
})
export class QuestionnaireService extends VisibilityService<QuestionnaireItemComponent, MatchedQuestion> {
    /**
     * Emits an updated list of matches
     */
    results$!: Observable<readonly MatchedQuestion[]>;

    constructor(private http: HttpClient, filterWorkerService: FilterWorkerService, ngZone: NgZone) {
        super(filterWorkerService, ngZone);
        this.results$ = this.filterWorkerService.results$.question;
        this.subscriptions = [
            this.results$.subscribe(results => { this.updateVisible(results); })
        ];
    }

    protected getId(model: MatchedQuestion): string {
        return model.id?.text;
    }

    async save(items: Iterable<Question>): Promise<{ success: boolean }> {
        const data = [...items];
        // if it has already been loaded, override it
        this.filterWorkerService.setData('question', data);

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
        this.filterWorkerService.setData('question', questionnaire);
        return Promise.resolve(questionnaire);
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
                        dialects: subentry['dialect'],
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

            yield* question.answers;
        }
    }

    getDialects(answers: Iterable<Answer>): Set<string> {
        const dialects = new Set<string>();
        for (const answer of answers) {
            for (const dialect of answer.dialects) {
                dialects.add(dialect);
            }
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
                dialects: answer.dialects
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
    filter(filters: ReadonlyArray<Filter<'question'>>, operator: FilterOperator): void {
        this.filterWorkerService.setFilters('question', filters, operator);
    }
}
