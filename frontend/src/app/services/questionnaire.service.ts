import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { MatchedQuestion, Question } from '../models/question';
import { Answer } from '../models/answer';
import { Participant } from '../models/participant';
import { Filter, FilterOperator } from '../models/filter';
import { MatchedAdverbial } from '../models/adverbial';
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

    /**
     * @param questionnaire Array of Question objects
     * @returns a Map with dialects as its keys and an Array of Answer objects as its values
     */
    convertToAnswersByDialect(questionnaire: ReadonlyArray<Question>) {
        const answerMap =  new Map<string, Answer[]>();
        for (const question of questionnaire) {
            for (const entry of question['answers']) {
                if (answerMap.has(entry['dialect'])) {
                    answerMap.get(entry['dialect']).push(entry);
                } else {
                    answerMap.set(entry['dialect'], [entry]);
                }
            }
        };
        return answerMap;
    }

    /**
     * Derives the participants from a Map containing answers
     * @param answers Map of a list of answers per dialect
     * @returns An array of Participant objects
     */
    getParticipants(answers: Map<string,Answer[]>) {
        const participants: Participant[] = [];
        const participantIds: string[] = [];
        for (const dialect of answers.keys()) {
            for (const answer of answers.get(dialect)) {
                const participant: Participant = {
                    participantId: answer['participantId'],
                    dialect: answer['dialect']
                };
                if (!participantIds.includes(participant.participantId)) {
                    participants.push(participant);
                    participantIds.push(participant.participantId);
                }
            }
        }
        return participants
    }

    private database: Question[] = [];
    /**
     * Taken verbatim from the adverbialsService
     */
    async filter(filters: ReadonlyArray<Filter>, operator: FilterOperator): Promise<Iterable<MatchedAdverbial | MatchedQuestion>> {
        const matched = this.database
            .map(object_to_filter => this.filterService.applyFilters(object_to_filter, filters, operator))
            .filter(object_to_filter => !!object_to_filter);

        return Promise.resolve(matched);
    }
}
