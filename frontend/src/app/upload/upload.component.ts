import { Component } from '@angular/core';
import { Adverbial } from '../models/adverbial';
import { ValidationErrors } from '../models/validationError';
import { FileUploadService } from './../services/file-upload.service';
import { faUpload } from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'mima-upload',
    templateUrl: './upload.component.html',
    styleUrls: ['./upload.component.scss']
})
export class UploadComponent {
    faUpload = faUpload;

    adverbials: Adverbial[];

    loading = false;
    messages: string[];
    file: File = null;
    fileName: string;
    shortLink = '';

    constructor(private fileUploadService: FileUploadService) {
    }

    async onChange(event: Event): Promise<void> {
        this.file = (event.target as HTMLInputElement).files[0];
        this.fileName = this.file.name;

        this.loading = !this.loading;
        delete this.messages;
        try {
            this.adverbials = await this.fileUploadService.upload(this.file);
        } catch (error) {
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
