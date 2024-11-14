import { createReducer, on } from '@ngrx/store';
import { initialState } from './questionnaire.state';
import { addFilter, clearFilters, removeFilter, setExcludingFilter, setFilters, setFiltersOperator, setMatchedQuestions, setQuestions, setIncludingFilter, updateFilter } from './questionnaire.actions';
import { MatchedQuestion } from './models/question';
import { handleExcludeFilter, handleIncludeFilter, handleRemoveFilter } from './filter.reducer';


export const questionnaireReducer = createReducer(
    initialState.questionnaire,
    on(setQuestions, (state, action) => ({
        ...state,
        questions: action.questions,
        questionsCount: action.questions.size
    })),
    on(clearFilters, (state) => ({
        ...state,
        filters: initialState.questionnaire.filters
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
        return handleRemoveFilter(initialState.questionnaire.filters, state, action);
    }),
    on(setMatchedQuestions, (state, action) => {
        const matchedQuestions = new Map<string, MatchedQuestion>();

        for (const match of action.matchedQuestions) {
            const id = match.id.text;
            matchedQuestions.set(id, match);
        }
        return {
            ...state,
            matchedQuestions,
            matchedQuestionsCount: matchedQuestions.size
        };
    })
)
