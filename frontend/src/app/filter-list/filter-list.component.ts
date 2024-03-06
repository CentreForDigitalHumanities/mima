import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { faPlus, faTimes } from '@fortawesome/free-solid-svg-icons';
import { Subscription, combineLatestWith } from 'rxjs';
import { addFilter, clearFilters, setFilters, setFiltersOperator, updateFilter } from '../questionnaire.actions';
import { State } from '../questionnaire.state';
import { Filter, FilterOperator } from '../models/filter';
import { isEmptyFilter } from '../services/filter.service';
import { FilterManagementService } from '../services/filter-management.service';
import { ProgressService } from '../services/progress.service';

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

    constructor(
        private activatedRoute: ActivatedRoute,
        private router: Router,
        private progressService: ProgressService,
        private filterManagementService: FilterManagementService,
        private store: Store<State>) {
    }

    ngOnInit(): void {
        this.subscriptions = [
            this.activatedRoute.queryParamMap.pipe(
                combineLatestWith(this.store.select('questionnaire', 'questions'))
            ).subscribe(([queryParams, questions]) => {
                const [operator, filters] = this.filterManagementService.fromQueryParams(queryParams, questions);
                if (filters.length) {
                    this.store.dispatch(setFilters({ filters }));
                    this.store.dispatch(setFiltersOperator({ operator }));
                }
            }),
            this.filterManagementService.queryParams$.subscribe(queryParams => {
                this.router.navigate(
                    [],
                    {
                        relativeTo: this.activatedRoute,
                        queryParams,
                        replaceUrl: true
                    })
            }),
            this.store.select('questionnaire', 'filters').subscribe(filters => {
                this.clearable = !!filters.find(filter => !isEmptyFilter(filter));

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
