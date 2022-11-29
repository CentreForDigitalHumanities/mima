import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { Store } from '@ngrx/store';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { Subscription } from 'rxjs';
import { addFilter, setFiltersOperator, updateFilter } from '../adverbial.actions';
import { State } from '../adverbial.state';
import { Filter, FilterOperator } from '../models/filter';

@Component({
    selector: 'mima-filter-list',
    templateUrl: './filter-list.component.html',
    styleUrls: ['./filter-list.component.scss']
})
export class FilterListComponent implements OnInit, OnDestroy {
    faPlus = faPlus;

    filterIndexes: number[] = [];
    operator: FilterOperator;

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
            }),
            this.store.select('adverbials', 'operator').subscribe(operator => {
                this.operator = operator;
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

    add(): void {
        this.store.dispatch(addFilter());
    }

    setOperator(operator: FilterOperator): void {
        this.store.dispatch(setFiltersOperator({ operator }));
    }
}
