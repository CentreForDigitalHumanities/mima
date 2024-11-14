import { Injectable, OnDestroy } from '@angular/core';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { filter, mergeMap } from 'rxjs/operators';
import { State, initialState } from './judgments.state';
import { addFilter, clearFilters, loadJudgments, removeFilter, setExcludingFilter, setFilters, setFiltersOperator, setIncludingFilter, setJudgments, setMatchedJudgments, updateFilter } from './judgments.actions';
import { FilterService } from './services/filter.service';
import { Judgment, MatchedJudgment } from './models/judgment';
import { Filter, FilterOperator } from './models/filter';
import { JudgmentsService } from './services/judgments.service';


@Injectable()
export class JudgmentsEffects implements OnDestroy {

    constructor(
        private actions$: Actions,
        private filterService: FilterService,
        private judgmentsService: JudgmentsService,
        private store: Store<State>
    ) {
        this.subscriptions = [
            this.judgmentsService.results$.subscribe((matchedJudgments: MatchedJudgment[]) => {
                store.dispatch(setMatchedJudgments({
                    matchedJudgments
                }))
            })
        ];
    }

    private subscriptions!: Subscription[];
    private currentFilters: readonly Filter<'judgment'>[] = [];
    private currentFilterOperator: FilterOperator = initialState.judgments.operator;

    loadJudgments$ = createEffect(() => this.actions$.pipe(
        ofType(loadJudgments),
        mergeMap(async () => {
            const judgmentArray = Array.from(await this.judgmentsService.get());
            const judgments = new Map<string, Judgment>();
            for (let judgment of judgmentArray) {
                judgments.set(judgment.judgmentId, judgment);
            }
            return setJudgments({
                judgments: judgments as ReadonlyMap<string, Judgment>,
                applyFilters: false
            });
        })
    ));

    filterJudgments$ = createEffect(() => this.actions$.pipe(
        ofType(addFilter, removeFilter, clearFilters, setFilters, setIncludingFilter, setExcludingFilter, updateFilter, setJudgments, setFiltersOperator),
        concatLatestFrom(() => [
            this.store.select('judgments', 'filters'),
            this.store.select('judgments', 'operator')
        ]),
        mergeMap(async ([action, filters, operator]) => {
            let matchedJudgments: MatchedJudgment[];
            if (action.type === '[Judgments] Set Judgments' && !action.applyFilters) {
                // match everything
                matchedJudgments = Array.from(action.judgments.values()).map(judgment => new MatchedJudgment(judgment));
                this.currentFilterOperator = operator;

                return setMatchedJudgments({
                    matchedJudgments: matchedJudgments as MatchedJudgment[]
                });
            } else {
                if (action.type !== '[Judgments] Set Judgments' && this.currentFilterOperator == operator && !this.filterService.differ(this.currentFilters, filters)) {
                    // equivalent filters, don´t update results
                    return null;
                }

                this.judgmentsService.filter(filters, operator);
                this.currentFilters = filters;
                this.currentFilterOperator = operator;

                return null;
            }
        }),
        filter(action => action !== null)
    ));

    ngOnDestroy(): void {
        this.subscriptions.forEach(s => s.unsubscribe());
    }
}
