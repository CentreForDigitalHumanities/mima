import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';

import { loadAdverbials } from '../adverbial.actions';
import { State } from '../adverbial.state';

@Component({
    selector: 'mima-adverbial-list-page',
    templateUrl: './adverbial-list-page.component.html',
    styleUrls: ['./adverbial-list-page.component.scss']
})
export class AdverbialListPageComponent implements OnInit {
    constructor(private store: Store<State>) {
    }

    async ngOnInit(): Promise<void> {
        this.store.dispatch(loadAdverbials());
    }


}
