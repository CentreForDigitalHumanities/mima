import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { Question } from '../models/question';
import { Answer } from '../models/answer';


@Injectable({
  providedIn: 'root'
})
export class QuestionnaireService {

    constructor(private http: HttpClient) { }

    async get() {
        const response = lastValueFrom(this.http.get('assets/cleaned_translation_questions.json'));

        try {
            const data = await response.then(res => res);
            const questionnaire = this.convertToQuestionnaire(data);
            return questionnaire;
        } catch (error) {
            throw error;
        }
    }

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
}
