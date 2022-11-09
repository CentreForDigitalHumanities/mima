import { createReducer, MetaReducer, on } from '@ngrx/store';
import { clearFilters, setFilters, setAdverbials, setMatchedAdverbials, updateFilter } from './adverbial.actions';
import { initialState, State } from './adverbial.state';
import { MatchedAdverbial } from './models/adverbial';

export const adverbialReducer = createReducer(
    initialState.adverbials,
    on(clearFilters, (state) => ({
        ...state,
        filters: initialState.adverbials.filters
    })),
    on(setFilters, (state, action) => ({
        ...state,
        filters: action.filters
    })),
    on(updateFilter, (state, action) => {
        const filters = [...state.filters];
        filters[action.filter.index] = action.filter;
        return {
            ...state,
            filters
        };
    }),
    on(setAdverbials, (state, action) => ({
        ...state,
        adverbials: action.adverbials,
        adverbialIds: action.adverbials.map(adverbial => adverbial.id)
    })),
    on(setMatchedAdverbials, (state, action) => {
        const matchedAdverbials = new Map<string, MatchedAdverbial>();
        const matchedAdverbialIds: string[] = [];

        for (const match of action.matchedAdverbials) {
            const id = match.id.text;
            matchedAdverbialIds.push(id);
            matchedAdverbials[id] = match;
        }
        return {
            ...state,
            matchedAdverbials,
            matchedAdverbialIds
        };
    })
);
