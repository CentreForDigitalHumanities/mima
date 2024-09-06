import { Injectable, OnDestroy } from '@angular/core';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { filter, mergeMap } from 'rxjs/operators';
import { State, initialState } from './judgments.state';
import { loadJudgments, setJudgments, setMatchedJudgments } from './judgments.actions';
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
            this.judgmentsService.results$.subscribe(matchedJudgments => {
                const filteredMatchedJudgments = matchedJudgments.filter(judgment => judgment instanceof MatchedJudgment);
                if (filteredMatchedJudgments.length > 0) {
                    store.dispatch(setMatchedJudgments({
                        matchedJudgments: filteredMatchedJudgments as MatchedJudgment[]
                    }));
                }
            })
        ];
    }

    private subscriptions!: Subscription[];
    private currentFilters: readonly Filter[] = [];
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
        ofType(setJudgments),
        mergeMap(async (action) => {
            let matchedJudgments: MatchedJudgment[];
            if (action.type === '[Judgments] Set Judgments' && !action.applyFilters) {
                // match everything
                matchedJudgments = Array.from(action.judgments.values()).map(judgment => new MatchedJudgment(judgment));
                // this.currentFilterOperator = action.operator;

                return setMatchedJudgments({
                    matchedJudgments: matchedJudgments as MatchedJudgment[]
                });
            }
        })
    ));

    ngOnDestroy(): void {
        this.subscriptions.forEach(s => s.unsubscribe());
    }
}
