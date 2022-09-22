import { Component, OnInit } from '@angular/core';
import { Adverbial } from '../models/adverbial';
import { FileUploadService } from './../services/file-upload.service';

@Component({
    selector: 'mima-upload',
    templateUrl: './upload.component.html',
    styleUrls: ['./upload.component.scss']
})
export class UploadComponent {
    adverbials: Adverbial[];

    loading = false;
    file: File = null;
    shortLink = '';

    constructor(private fileUploadService: FileUploadService) {
    }

    onChange(event: Event): void {
        this.file = (event.target as HTMLInputElement).files[0];
    }

    onUpload(): void {
        this.loading = !this.loading;
        console.log(this.file);

        this.fileUploadService.upload(this.file).subscribe(
            (adverbials: Adverbial[]) => {
                this.loading = false;
                // TODO: move this to service
                for (const adverbial of adverbials) {
                    adverbial['Labels'] = adverbial['Label'].split('+');
                }
                this.adverbials = adverbials;
            }
        );
    }
}
