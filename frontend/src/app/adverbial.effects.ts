import { Injectable } from '@angular/core';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { mergeMap } from 'rxjs/operators';
import {
    addFilter,
    clearFilters,
    loadAdverbials,
    removeFilter,
    setAdverbials,
    setFilters,
    setFiltersOperator,
    setMatchedAdverbials,
    updateFilter
} from './adverbial.actions';
import { State } from './adverbial.state';
import { MatchedAdverbial } from './models/adverbial';
import { AdverbialsService } from './services/adverbials.service';

@Injectable()
export class AdverbialEffects {

    loadAdverbials$ = createEffect(() => this.actions$.pipe(
        ofType(loadAdverbials),
        mergeMap(async () => {
            const adverbials = Array.from(await this.adverbialService.get());
            return setAdverbials({
                adverbials,
                applyFilters: true
            });
        })
    ));

    filterAdverbials$ = createEffect(() => this.actions$.pipe(
        ofType(addFilter, removeFilter, clearFilters, setFilters, updateFilter, setAdverbials, setFiltersOperator),
        concatLatestFrom(() => [
            this.store.select('adverbials', 'filters'),
            this.store.select('adverbials', 'operator')
        ]),
        mergeMap(async ([action, filters, operator]) => {
            let matchedAdverbials: MatchedAdverbial[];
            if (action.type === '[Adverbials] Set Adverbials' && !action.applyFilters) {
                // match everything
                matchedAdverbials = action.adverbials.map(adverbial => new MatchedAdverbial(adverbial));
            } else {
                matchedAdverbials = Array.from(await this.adverbialService.filter(filters, operator));
            }

            return setMatchedAdverbials({
                matchedAdverbials
            });
        })
    ));

    constructor(
        private actions$: Actions,
        private adverbialService: AdverbialsService,
        private store: Store<State>
    ) { }
}
