import { createReducer, on } from '@ngrx/store';
import {
    addFilter,
    clearFilters,
    removeFilter,
    setAdverbials,
    setFilters,
    setFiltersOperator,
    setMatchedAdverbials,
    updateFilter
} from './adverbial.actions';
import { initialState } from './adverbial.state';
import { MatchedAdverbial } from './models/adverbial';
import { Filter } from './models/filter';

export const adverbialReducer = createReducer(
    initialState.adverbials,
    on(clearFilters, (state) => ({
        ...state,
        filters: initialState.adverbials.filters
    })),
    on(addFilter, (state) => ({
        ...state,
        filters: state.filters.concat([{ index: state.filters.length, field: '*', content: [] }])
    })),
    on(setFilters, (state, action) => ({
        ...state,
        filters: action.filters
    })),
    on(setFiltersOperator, (state, action) => ({
        ...state,
        operator: action.operator
    })),
    on(updateFilter, (state, action) => {
        const filters = [...state.filters];
        filters[action.filter.index] = action.filter;
        return {
            ...state,
            filters
        };
    }),
    on(removeFilter, (state, action) => {
        let filters: Filter[];
        if (state.filters.length > 1) {
            filters = [];
            for (let i = 0; i < state.filters.length; i++) {
                if (i < action.filterIndex) {
                    filters.push(state.filters[i]);
                } else if (i > action.filterIndex) {
                    filters.push({
                        ...state.filters[i],
                        index: i - 1
                    });
                }
            }
        }

        return {
            ...state,
            filters: filters || initialState.adverbials.filters
        };
    }),
    on(setAdverbials, (state, action) => ({
        ...state,
        adverbials: action.adverbials,
        adverbialsCount: action.adverbials.length,
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
            matchedAdverbialsCount: matchedAdverbialIds.length,
            matchedAdverbialIds
        };
    })
);
