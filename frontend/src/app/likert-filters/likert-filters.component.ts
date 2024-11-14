import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { BehaviorSubject, combineLatestWith, map, Observable, Subscription } from 'rxjs';
import {
    faAsterisk,
    faComment,
    faLanguage,
    faUser,
    faCommentDots
} from '@fortawesome/free-solid-svg-icons';
import { FilterListComponent } from "../filter-list/filter-list.component";
import { State } from '../judgments.state';
import { Filter, FilterField, FilterOperator, FilterType } from '../models/filter';
import { addFilter, clearFilters, removeFilter, setFilters, setFiltersOperator, updateFilter } from '../judgments.actions';
import { FilterFieldOptions, FilterManagementService } from '../services/filter-management.service';
import { Judgment } from '../models/judgment';


@Component({
    selector: 'mima-likert-filters',
    standalone: true,
    imports: [FilterListComponent],
    templateUrl: './likert-filters.component.html',
    styleUrl: './likert-filters.component.scss'
})
export class LikertFiltersComponent implements OnInit, OnDestroy {
    private subscriptions: Subscription[];
    private judgments: BehaviorSubject<ReadonlyMap<string, Judgment>> = new BehaviorSubject(new Map());

    loading = true;
    filters: readonly Filter<'judgment'>[];
    operator: FilterOperator;

    filterTypes: FilterType<'judgment'>[] = [{
        name: '',
        field: '*',
        icon: faAsterisk,
        dropdown: false,
        placeholder: $localize`Search in all Fields`,
        manual: 'query'
    }, {
        name: $localize`Question`,
        field: 'mainQuestionId',
        icon: faComment,
        dropdown: true,
        placeholder: $localize`Select Question(s)`
    }, {
        name: $localize`Question Text`,
        field: 'mainQuestion',
        icon: faCommentDots,
        dropdown: false,
        placeholder: ''
    }, {
        name: $localize`Sub-Question`,
        field: 'subQuestionTextId',
        icon: faComment,
        dropdown: true,
        placeholder: $localize`Select Sub-Question(s)`
    }, {
        name: $localize`Sub-Question Text`,
        field: 'subQuestion',
        icon: faCommentDots,
        dropdown: false,
        placeholder: ''
    }, {
        name: $localize`Dialect`,
        field: 'dialect',
        icon: faLanguage,
        dropdown: true,
        placeholder: $localize`Select Dialect(s)`
    }, {
        name: $localize`Participant`,
        field: 'participantId',
        icon: faUser,
        dropdown: true,
        placeholder: $localize`Select Participant(s)`
    }, {
        name: $localize`Score`,
        field: 'score',
        icon: faUser,
        dropdown: true,
        placeholder: $localize`Select Score`
    }, {
        name: `Judgment`,
        field: 'judgmentId',
        icon: faUser,
        dropdown: true,
        placeholder: $localize`Judgement ID`
    }];

    constructor(
        private activatedRoute: ActivatedRoute,
        private router: Router,
        private filterManagementService: FilterManagementService,
        private store: Store<State>) {
    }

    ngOnInit(): void {
        this.subscriptions = [
            this.store.select('judgments', 'judgments').subscribe(
                judgments => {
                        this.judgments.next(judgments);
                        this.loading = false;
                }),
            this.activatedRoute.queryParamMap.pipe(
                combineLatestWith(this.judgments)
            ).subscribe(([queryParams, judgments]) => {
                if (this.loading) {
                    // do not update state until everything is available
                    return;
                }
                const [operator, filters] = this.filterManagementService.fromQueryParams('judgment', queryParams, judgments);
                if (filters.length) {
                    this.store.dispatch(setFilters({ filters }));
                    this.store.dispatch(setFiltersOperator({ operator }));
                }
            }),
            this.filterManagementService.queryParams$.judgment.subscribe(queryParams => {
                this.router.navigate(
                    [],
                    {
                        relativeTo: this.activatedRoute,
                        queryParams,
                        replaceUrl: true
                    })
            }),
            this.store.select('judgments', 'filters').subscribe(filters => {
                this.filters = filters;
            }),
            this.store.select('judgments', 'operator').subscribe(operator => {
                this.operator = operator;
            })
        ];
    }

    ngOnDestroy(): void {
        for (const subscription of this.subscriptions) {
            subscription.unsubscribe();
        }
    }

    filterChange(updated: Filter<'judgment'>): void {
        this.store.dispatch(updateFilter({ filter: updated }));
    }

    add(): void {
        this.store.dispatch(addFilter());
    }

    clear(): void {
        this.store.dispatch(clearFilters());
    }

    remove(filterIndex: number): void {
        this.store.dispatch(removeFilter({ filterIndex }));
    }

    setOperator(operator: FilterOperator): void {
        this.store.dispatch(setFiltersOperator({ operator }));
    }

    getFilterFieldOptions: (field: FilterField<'judgment'>) => Observable<FilterFieldOptions> = (field) => {
        return this.judgments.pipe(
            map(judgments => this.filterManagementService.filterFieldOptions(
                'judgment',
                field,
                judgments)));
    }
}
