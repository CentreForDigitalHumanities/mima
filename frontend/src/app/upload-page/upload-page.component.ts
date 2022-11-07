import { Component, OnInit } from '@angular/core';
import { faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { Adverbial, MatchedAdverbial } from '../models/adverbial';
import { AdverbialsService } from '../services/adverbials.service';

@Component({
    selector: 'mima-upload-page',
    templateUrl: './upload-page.component.html',
    styleUrls: ['./upload-page.component.scss']
})
export class UploadPageComponent implements OnInit {
    faCheckCircle = faCheckCircle;

    adverbials: Adverbial[];
    matchedAdverbials: MatchedAdverbial[];
    state: 'upload' | 'review' | 'save' | 'saved' = 'upload';
    savedCount: number;

    loading = false;

    constructor(private adverbialsService: AdverbialsService) { }

    ngOnInit(): void {
    }

    setAdverbials(adverbials: Adverbial[]): void {
        this.adverbials = adverbials;
        this.matchedAdverbials = adverbials.map(adverbial => new MatchedAdverbial(adverbial));
        this.state = 'review';
    }

    async save(): Promise<void> {
        this.loading = true;
        const result = await this.adverbialsService.save(this.adverbials);
        if (result.success) {
            this.savedCount = this.adverbials.length;
            delete this.adverbials;
            this.state = 'saved';
        } else {
            // TODO: notification
            alert('Saving failed');
        }
        this.loading = false;
    }
}
