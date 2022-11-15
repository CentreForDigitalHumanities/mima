import { Component, EventEmitter, Output } from '@angular/core';
import { faUpload } from '@fortawesome/free-solid-svg-icons';
import { Adverbial } from '../models/adverbial';
import { ValidationErrors } from '../models/validationError';
import { FileUploadService } from './../services/file-upload.service';

@Component({
    selector: 'mima-upload',
    templateUrl: './upload.component.html',
    styleUrls: ['./upload.component.scss']
})
export class UploadComponent {
    @Output()
    adverbials = new EventEmitter<Adverbial[]>();

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
            this.adverbials.next(await this.fileUploadService.upload(this.file));
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
