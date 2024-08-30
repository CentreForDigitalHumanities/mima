import { Injectable, OnDestroy } from '@angular/core';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { filter, mergeMap } from 'rxjs/operators';
import { State, initialState } from './judgements.state';
import { loadJudgements, setJudgements, setMatchedJudgements } from './judgements.actions';
import { FilterService } from './services/filter.service';
import { Judgement, MatchedJudgement } from './models/judgement';
import { Filter, FilterOperator } from './models/filter';
import { JudgementsService } from './services/judgements.service';


@Injectable()
export class JudgementsEffects implements OnDestroy {

    constructor(
        private actions$: Actions,
        private filterService: FilterService,
        private judgementsService: JudgementsService,
        private store: Store<State>
    ) {
        this.subscriptions = [
            this.judgementsService.results$.subscribe(matchedJudgements => {
                const filteredMatchedJudgements = matchedJudgements.filter(judgement => judgement instanceof MatchedJudgement);
                if (filteredMatchedJudgements.length > 0) {
                    store.dispatch(setMatchedJudgements({
                        matchedJudgements: filteredMatchedJudgements as MatchedJudgement[]
                    }));
                }
            })
        ];
    }

    private subscriptions!: Subscription[];
    private currentFilters: readonly Filter[] = [];
    private currentFilterOperator: FilterOperator = initialState.judgements.operator;

    loadJudgements$ = createEffect(() => this.actions$.pipe(
        ofType(loadJudgements),
        mergeMap(async () => {
            const judgementArray = Array.from(await this.judgementsService.get());
            const judgements = new Map<string, Judgement>();
            for (let judgement of judgementArray) {
                judgements.set(judgement.judgementId, judgement);
            }
            return setJudgements({
                judgements: judgements as ReadonlyMap<string, Judgement>,
                applyFilters: false
            });
        })
    ));

    filterJudgements$ = createEffect(() => this.actions$.pipe(
        ofType(setJudgements),
        mergeMap(async (action) => {
            let matchedJudgements: MatchedJudgement[];
            if (action.type === '[Judgements] Set Judgements' && !action.applyFilters) {
                // match everything
                matchedJudgements = Array.from(action.judgements.values()).map(judgement => new MatchedJudgement(judgement));
                // this.currentFilterOperator = action.operator;

                return setMatchedJudgements({
                    matchedJudgements: matchedJudgements as MatchedJudgement[]
                });
            }
        })
    ));

    ngOnDestroy(): void {
        this.subscriptions.forEach(s => s.unsubscribe());
    }
}
