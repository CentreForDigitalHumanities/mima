import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { Store } from '@ngrx/store';
import { faPlus, faTimes } from '@fortawesome/free-solid-svg-icons';
import { Subscription } from 'rxjs';
import { addFilter, clearFilters, setFiltersOperator, updateFilter } from '../questionnaire.actions';
import { State } from '../questionnaire.state';
import { Filter, FilterOperator } from '../models/filter';
import { isDefaultFilter } from '../services/filter.service';

@Component({
    selector: 'mima-filter-list',
    templateUrl: './filter-list.component.html',
    styleUrls: ['./filter-list.component.scss']
})
export class FilterListComponent implements OnInit, OnDestroy {
    faPlus = faPlus;
    faTimes = faTimes;

    clearable = false;
    filterIndexes: number[] = [];
    operator: FilterOperator;

    private subscriptions: Subscription[];

    @Output()
    filtersChange = new EventEmitter<Filter[]>();

    constructor(private store: Store<State>) {
    }

    ngOnInit(): void {
        this.subscriptions = [
            this.store.select('questionnaire', 'filters').subscribe(filters => {
                this.clearable = (filters.length > 1 || !isDefaultFilter(filters[0]));

                if (this.filterIndexes.length !== filters.length) {
                    this.filterIndexes = [];
                    for (let i = 0; i < filters.length; i++) {
                        this.filterIndexes[i] = i;
                    }
                }
            }),
            this.store.select('questionnaire', 'operator').subscribe(operator => {
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

    clear(): void {
        this.clearable = false;
        this.store.dispatch(clearFilters());
    }

    setOperator(operator: FilterOperator): void {
        this.store.dispatch(setFiltersOperator({ operator }));
    }
}
