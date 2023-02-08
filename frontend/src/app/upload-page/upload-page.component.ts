import { Component } from '@angular/core';
import { faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { Store } from '@ngrx/store';
import { setAdverbials } from '../adverbial.actions';
import { State } from '../adverbial.state';
import { Adverbial } from '../models/adverbial';
import { AdverbialsService } from '../services/adverbials.service';

@Component({
    selector: 'mima-upload-page',
    templateUrl: './upload-page.component.html',
    styleUrls: ['./upload-page.component.scss']
})
export class UploadPageComponent {
    faCheckCircle = faCheckCircle;

    adverbials: Adverbial[];
    state: 'upload' | 'review' | 'save' | 'saved' = 'upload';
    savedCount: number;

    loading = false;

    constructor(private adverbialsService: AdverbialsService, private store: Store<State>) { }

    setAdverbials(adverbials: Adverbial[]): void {
        this.adverbials = adverbials;
        this.store.dispatch(setAdverbials({ adverbials }));
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
            alert($localize`Saving failed`);
        }
        this.loading = false;
    }
}
