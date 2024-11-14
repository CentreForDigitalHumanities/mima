import { createReducer, on } from '@ngrx/store';
import { initialState } from './judgments.state';
import { addFilter, clearFilters, removeFilter, setExcludingFilter, setFilters, setFiltersOperator, setIncludingFilter, setJudgments, setMatchedJudgments, toggleShow, updateFilter } from './judgments.actions';
import { MatchedJudgment } from './models/judgment';
import { handleExcludeFilter, handleIncludeFilter, handleRemoveFilter } from './filter.reducer';


export const judgmentsReducer = createReducer(
    initialState.judgments,
    on(setJudgments, (state, action) => {
        return {
            ...state,
            judgments: action.judgments
        };
    }),
    on(clearFilters, (state) => ({
        ...state,
        filters: initialState.judgments.filters
    })),
    on(addFilter, (state) => ({
        ...state,
        filters: state.filters.concat([{ index: state.filters.length, field: '*', content: [], onlyFullMatch: false }])
    })),
    on(setIncludingFilter, (state, action) => {
        return handleIncludeFilter(state, action);
    }),
    on(setExcludingFilter, (state, action) => {
        return handleExcludeFilter(state, action);
    }),
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
        return handleRemoveFilter(initialState.judgments.filters, state, action);
    }),
    on(setMatchedJudgments, (state, action) => {
        const matchedJudgments = new Map<string, MatchedJudgment>();

        for (const match of action.matchedJudgments) {
            const id = match.judgmentId.text;
            matchedJudgments.set(id, match);
        }
        return {
            ...state,
            matchedJudgments,
            matchedJudgmentsCount: matchedJudgments.size
        };
    }),
    on(toggleShow, (state, action) => {
        return {
            ...state,
            show: action.show ?? (state.show === 'count' ? 'percentage' : 'count')
        };
    })
);
