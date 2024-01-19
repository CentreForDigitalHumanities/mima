import { Component, Input } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faDownload } from '@fortawesome/free-solid-svg-icons';
import { MatchedQuestion } from '../models/question';
import { DownloadService } from '../services/download.service';

@Component({
    selector: 'mima-download-button',
    standalone: true,
    imports: [FontAwesomeModule],
    templateUrl: './download-button.component.html',
    styleUrl: './download-button.component.scss'
})
export class DownloadButtonComponent {
    faDownload = faDownload;

    @Input()
    matchedQuestions: ReadonlyMap<string, MatchedQuestion>;

    constructor(private downloadService: DownloadService) {

    }

    download() {
        this.downloadService.downloadQuestions(this.matchedQuestions.values());
    }
}
