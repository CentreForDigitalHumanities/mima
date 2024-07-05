import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faUpload } from '@fortawesome/free-solid-svg-icons';
import { ValidationErrors } from '../models/validationError';
import { Question } from '../models/question';
import { FileUploadService } from './../services/file-upload.service';

@Component({
    selector: 'mima-upload',
    templateUrl: './upload.component.html',
    styleUrls: ['./upload.component.scss'],
    standalone: true,
    imports: [CommonModule, FontAwesomeModule]
})
export class UploadComponent {
    @Output()
    questions = new EventEmitter<Question[]>();

    faUpload = faUpload;

    loading = false;
    messages: string[];
    file: File = null;
    fileName: string;
    shortLink = '';

    state: 'empty' | 'error' | 'success' = 'empty';

    constructor(private fileUploadService: FileUploadService) {
    }

    async onChange(event: Event): Promise<void> {
        this.file = (event.target as HTMLInputElement).files[0];
        this.fileName = this.file.name;

        this.loading = true;
        delete this.messages;
        try {
            this.questions.emit(await this.fileUploadService.upload(this.file));
            this.state = 'success';
        } catch (error) {
            this.state = 'error';
            if (error instanceof ValidationErrors) {
                this.messages = Array.from(error.toStrings());
            } else {
                throw error;
            }
        } finally {
            this.loading = false;
        }
    }
}
