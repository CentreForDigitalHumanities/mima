import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { BehaviorSubject, combineLatestWith, map, Observable, Subscription } from 'rxjs';
import {
    faAsterisk,
    faComment,
    faGlobeEurope,
    faLanguage,
    faUser,
    faCommentDots
} from '@fortawesome/free-solid-svg-icons';
import { FilterListComponent } from "../filter-list/filter-list.component";
import { State } from '../questionnaire.state';
import { Filter, FilterField, FilterOperator, FilterType } from '../models/filter';
import { addFilter, clearFilters, removeFilter, setFilters, setFiltersOperator, updateFilter } from '../questionnaire.actions';
import { FilterFieldOptions, FilterManagementService } from '../services/filter-management.service';
import { Question } from '../models/question';

@Component({
    selector: 'mima-questionnaire-filters',
    standalone: true,
    imports: [FilterListComponent],
    templateUrl: './questionnaire-filters.component.html',
    styleUrl: './questionnaire-filters.component.scss'
})
export class QuestionnaireFiltersComponent implements OnInit, OnDestroy {
    private subscriptions: Subscription[];
    private questions: BehaviorSubject<ReadonlyMap<string, Question>> = new BehaviorSubject(new Map());

    loading = true;
    filters: readonly Filter<'question'>[];
    operator: FilterOperator;

    filterTypes: FilterType<'question'>[] = [{
        name: '',
        field: '*',
        icon: faAsterisk,
        mode: 'text',
        placeholder: $localize`Search in all Fields`,
        manual: 'query'
    }, {
        name: $localize`Question`,
        field: 'id',
        icon: faComment,
        mode: 'dropdown',
        placeholder: $localize`Select Question(s)`
    }, {
        name: $localize`Question Text`,
        field: 'prompt',
        icon: faCommentDots,
        mode: 'text',
        placeholder: ''
    }, {
        name: $localize`Translation`,
        field: 'answer',
        icon: faGlobeEurope,
        mode: 'text',
        placeholder: ''
    }, {
        name: $localize`Dialect`,
        field: 'dialects',
        icon: faLanguage,
        mode: 'dialect',
        placeholder: $localize`Select Dialect(s)`
    }, {
        name: $localize`Participant`,
        field: 'participantId',
        icon: faUser,
        mode: 'dropdown',
        placeholder: $localize`Select Participant(s)`
    }, {
        name: $localize`Attestation`,
        field: 'attestation',
        icon: faUser,
        mode: 'dropdown',
        placeholder: $localize`Select Attested or Unattested`,
        manual: 'attestation'
    }, {
        name: $localize`Gloss`,
        field: 'gloss',
        icon: faUser,
        mode: 'text',
        placeholder: ''
    }, {
        name: $localize`English Translation`,
        field: 'en_translation',
        icon: faUser,
        mode: 'text',
        placeholder: ''
    }, {
        name: $localize`Chapter`,
        field: 'chapter',
        icon: faUser,
        mode: 'dropdown',
        placeholder: $localize`Select Chapter(s)`,
        manual: 'chapters'
    }, {
        name: `Subtags`,
        field: 'subtags',
        icon: faUser,
        mode: 'dropdown',
        placeholder: $localize`Select Tag(s)`
    }];

    constructor(
        private activatedRoute: ActivatedRoute,
        private router: Router,
        private filterManagementService: FilterManagementService,
        private store: Store<State>) {
    }

    ngOnInit(): void {
        this.subscriptions = [
            this.store.select('questionnaire', 'questions').subscribe(
                questions => {
                    this.questions.next(questions);
                    this.loading = false;
                }),
            this.activatedRoute.queryParamMap.pipe(
                combineLatestWith(this.questions),
            ).subscribe(([queryParams, questions]) => {
                if (this.loading) {
                    // do not update state until everything is available
                    return;
                }
                const [operator, filters] = this.filterManagementService.fromQueryParams('question', queryParams, questions);
                if (filters.length) {
                    this.store.dispatch(setFilters({ filters }));
                    this.store.dispatch(setFiltersOperator({ operator }));
                }
            }),
            this.filterManagementService.queryParams$.question.subscribe(queryParams => {
                this.router.navigate(
                    [],
                    {
                        relativeTo: this.activatedRoute,
                        queryParams,
                        replaceUrl: true
                    })
            }),
            this.store.select('questionnaire', 'filters').subscribe(filters => {
                this.filters = filters;
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

    filterChange(updated: Filter<'question'>): void {
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

    getFilterFieldOptions: (field: FilterField<'question'>) => Observable<FilterFieldOptions> = (field) => {
        return this.questions.pipe(
            map(questions => this.filterManagementService.filterFieldOptions(
                'question',
                field,
                questions)));
    }
}
