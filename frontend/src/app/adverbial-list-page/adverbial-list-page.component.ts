import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import { loadAdverbials } from '../adverbial.actions';
import { State } from '../adverbial.state';

@Component({
    selector: 'mima-adverbial-list-page',
    templateUrl: './adverbial-list-page.component.html',
    styleUrls: ['./adverbial-list-page.component.scss']
})
export class AdverbialListPageComponent implements OnInit {
    matchCount$: Observable<number>;
    totalCount$: Observable<number>;

    constructor(private store: Store<State>) {
        this.matchCount$ = this.store.select('adverbials', 'matchedAdverbialsCount');
        this.totalCount$ = this.store.select('adverbials', 'adverbialsCount');
    }

    async ngOnInit(): Promise<void> {
        this.store.dispatch(loadAdverbials());
    }
}
