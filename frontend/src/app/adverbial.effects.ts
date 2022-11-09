import { Injectable } from '@angular/core';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { mergeMap } from 'rxjs/operators';
import { clearFilters, loadAdverbials, setAdverbials, setFilters, setMatchedAdverbials, updateFilter } from './adverbial.actions';
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
                adverbials
            });
        })
    ));

    filterAdverbials$ = createEffect(() => this.actions$.pipe(
        ofType(clearFilters, setFilters, updateFilter, setAdverbials),
        concatLatestFrom(() => this.store.select('adverbials', 'filters')),
        mergeMap(async ([action, filters]) => {
            let matchedAdverbials: MatchedAdverbial[];
            if (action.type === '[Adverbials] Set Adverbials') {
                // match everything
                matchedAdverbials = action.adverbials.map(adverbial => new MatchedAdverbial(adverbial));
            } else {
                matchedAdverbials = Array.from(await this.adverbialService.filter(filters));
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
