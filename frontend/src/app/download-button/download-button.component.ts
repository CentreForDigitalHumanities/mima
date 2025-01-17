import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faDownload } from '@fortawesome/free-solid-svg-icons';

import { Filter, FilterField } from '../models/filter';
import { MatchedQuestion } from '../models/question';
import { DownloadService } from '../services/download.service';
import { State } from '../questionnaire.state';

const FilterFieldNames: {
    [T in FilterField<'question'>]?: string
} = {
    '*': $localize`any`,
    id: $localize`question`,
    prompt: $localize`question`,
    answer: $localize`translation`,
    dialects: $localize`dialect`,
    participantId: $localize`participant`
};

@Component({
    selector: 'mima-download-button',
    standalone: true,
    imports: [FontAwesomeModule],
    templateUrl: './download-button.component.html',
    styleUrl: './download-button.component.scss'
})
export class DownloadButtonComponent implements OnInit, OnDestroy {
    faDownload = faDownload;
    filters: readonly Filter<'question'>[] = [];

    subscription = new Subscription();

    @Input()
    matchedQuestions: ReadonlyMap<string, MatchedQuestion>;

    constructor(private store: Store<State>, private downloadService: DownloadService) {
    }

    ngOnInit(): void {
        this.subscription.add(
            this.store.select('questionnaire', 'filters').subscribe(filters => {
                this.filters = filters;
            }));
    }

    ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }

    download() {
        const filename = [
            'mima',
            ...new Set(this.filters.filter(f => f.content?.length).map(f => FilterFieldNames[f.field] ?? f.field))
        ].join('-') + '.csv';

        this.downloadService.downloadQuestions(this.matchedQuestions.values(), filename);
    }
}
