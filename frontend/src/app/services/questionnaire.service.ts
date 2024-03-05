import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { MatchedQuestion, Question } from '../models/question';
import { Answer } from '../models/answer';
import { Participant } from '../models/participant';
import { Filter, FilterOperator } from '../models/filter';
import { FilterService } from './filter.service';


@Injectable({
    providedIn: 'root'
})
export class QuestionnaireService {

    constructor(private http: HttpClient, private filterService: FilterService) { }

    /**
     * Reads the json file in assets
     * @returns a Promise of an Array of Question objects
     */
    async get(): Promise<ReadonlyArray<Question>> {
        const response = lastValueFrom(this.http.get('assets/cleaned_translation_questions.json'));

        try {
            const data = await response.then(res => res);
            const questionnaire = this.convertToQuestionnaire(data);
            this.database.push(...questionnaire);
            return Promise.resolve(questionnaire);
        } catch (error) {
            throw error;
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

    private database: Question[] = [];
    /**
     * Taken verbatim from the adverbialsService
     */
    async filter(filters: ReadonlyArray<Filter>, operator: FilterOperator): Promise<Iterable<MatchedQuestion>> {
        const matched = this.database
            .map(question => this.filterService.applyFilters(question, filters, operator))
            .filter(question => !!question);

        return Promise.resolve(matched);
    }
}
