import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { Question } from '../models/question';
import { Answer } from '../models/answer';
import { Participant } from '../models/participant';


@Injectable({
  providedIn: 'root'
})
export class QuestionnaireService {

    constructor(private http: HttpClient) { }

    /**
     * Reads the json file in assets
     * @returns a Promise of an Array of Question objects
     */
    async get(): Promise<ReadonlyArray<Question>> {
        const response = lastValueFrom(this.http.get('assets/cleaned_translation_questions.json'));

        try {
            const data = await response.then(res => res);
            const questionnaire = this.convertToQuestionnaire(data);
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
                const answer: Answer = {
                    questionId: subentry['tag'],
                    answer: subentry['answer'],
                    participantId: subentry['participant_id'],
                    dialect: subentry['dialect']
                }
                answers.push(answer);
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
        const answers =  new Map<string, Answer[]>();
        for (const question of questionnaire) {
            for (const subentry of question['answers']) {
                for (let example of subentry['answer'].split('|')) {
                    const answer: Answer = {
                        questionId: subentry['questionId'],
                        answer: example,
                        participantId: subentry['participantId'],
                        dialect: subentry['dialect']
                    }
                    if (answers.has(subentry['dialect'])) {
                        answers.get(subentry['dialect']).push(answer);
                    } else {
                        answers.set(subentry['dialect'], [answer]);
                    }
                }
            };
        }
        return answers;
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
}
