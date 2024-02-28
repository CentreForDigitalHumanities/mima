import { Component } from '@angular/core';
import { faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { Store } from '@ngrx/store';
import { setQuestions } from '../questionnaire.actions';
import { State } from '../questionnaire.state';
import { FileUploadService } from './../services/file-upload.service'; // Just for the temporary pilot upload
import { Question } from '../models/question';
import { QuestionnaireService } from '../services/questionnaire.service';

@Component({
    selector: 'mima-upload-page',
    templateUrl: './upload-page.component.html',
    styleUrls: ['./upload-page.component.scss']
})
export class UploadPageComponent {
    faCheckCircle = faCheckCircle;

    questions: Question[];
    state: 'upload' | 'review' | 'save' | 'saved' = 'upload';
    savedCount: number;

    loading = false;

    constructor(private questionnaireService: QuestionnaireService, private fileUploadService: FileUploadService, private store: Store<State>) { }

    setQuestions(questions: Question[]): void {
        this.questions = questions;
        const questionsMap = new Map<string, Question>();
        for (const question of questions) {
            questionsMap[question.id] = question;
        }

        this.store.dispatch(setQuestions({ questions: questionsMap, applyFilters: false }));
        this.state = 'review';
    }

    async save(): Promise<void> {
        this.loading = true;
        const result = await this.questionnaireService.save(this.questions);
        if (result.success) {
            this.savedCount = this.questions.length;
            delete this.questions;
            this.state = 'saved';
        } else {
            // TODO: notification
            alert($localize`Saving failed`);
        }
        this.loading = false;
    }

    async onUploadPilot(): Promise<void> {
        const pilotAdverbials = await this.fileUploadService.uploadPilot();
        this.setQuestions(pilotAdverbials);
        this.save();
    }

    async onUploadQuestionnaire(abridged: boolean): Promise<void> {
        const questAdverbials = await this.fileUploadService.uploadQuestionnaire(abridged);
        this.setQuestions(questAdverbials);
        // this.save();
    }
}
