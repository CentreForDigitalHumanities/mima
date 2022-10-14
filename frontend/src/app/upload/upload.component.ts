import { Component } from '@angular/core';
import { Adverbial } from '../models/adverbial';
import { ValidationErrors } from '../models/validationError';
import { FileUploadService } from './../services/file-upload.service';

@Component({
    selector: 'mima-upload',
    templateUrl: './upload.component.html',
    styleUrls: ['./upload.component.scss']
})
export class UploadComponent {
    adverbials: Adverbial[];

    loading = false;
    messages: string[];
    file: File = null;
    shortLink = '';

    constructor(private fileUploadService: FileUploadService) {
    }

    onChange(event: Event): void {
        this.file = (event.target as HTMLInputElement).files[0];
    }

    async onUpload(): Promise<void> {
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
