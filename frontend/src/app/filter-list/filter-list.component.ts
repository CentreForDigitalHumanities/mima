import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { updateFilter } from '../adverbial.actions';
import { State } from '../adverbial.state';
import { Filter } from '../models/filter';

@Component({
    selector: 'mima-filter-list',
    templateUrl: './filter-list.component.html',
    styleUrls: ['./filter-list.component.scss']
})
export class FilterListComponent implements OnInit, OnDestroy {
    filterIndexes: number[] = [];
    private subscriptions: Subscription[];

    @Output()
    filtersChange = new EventEmitter<Filter[]>();

    constructor(private store: Store<State>) {
    }

    ngOnInit(): void {
        this.subscriptions = [
            this.store.select('adverbials', 'filters').subscribe(filters => {
                if (this.filterIndexes.length !== filters.length) {
                    this.filterIndexes = [];
                    for (let i = 0; i < filters.length; i++) {
                        this.filterIndexes[i] = i;
                    }
                }
            })
        ];
    }

    ngOnDestroy(): void {
        for (const subscription of this.subscriptions) {
            subscription.unsubscribe();
        }
    }

    filterChange(updated: Filter): void {
        this.store.dispatch(updateFilter({ filter: updated }));
    }

}
