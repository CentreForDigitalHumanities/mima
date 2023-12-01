import { createReducer, on } from '@ngrx/store';
import { initialState } from './questionnaire.state';
import { addFilter, clearFilters, removeFilter, setExcludingFilter, setFilters, setFiltersOperator, setMatchedQuestions, setQuestions, setSingularFilter, updateFilter } from './questionnaire.actions';
import { MatchedQuestion } from './models/question';
import { Filter, FilterOperator } from './models/filter';
import { isDefaultFilter } from './services/filter.service';


export const questionnaireReducer = createReducer(
    initialState.questionnaire,
    on(setQuestions, (state, action) => ({
        ...state,
        questions: action.questions,
        questionsCount: action.questions.size,
        questionIds: Array.from(action.questions.keys())
    })),
    on(clearFilters, (state) => ({
        ...state,
        filters: initialState.questionnaire.filters
    })),
    on(addFilter, (state) => ({
        ...state,
        filters: state.filters.concat([{ index: state.filters.length, field: '*', content: [], onlyFullMatch: false }])
    })),
    on(setSingularFilter, (state, action) => {
        // remove default filter
        const filters = state.filters.filter(filter => !isDefaultFilter(filter));

        // find existing filter on this field
        const filterIndex = filters.findIndex(filter => filter.field === action.field);
        if (filterIndex !== -1) {
            // remove any more filters on this field
            for (let i = filterIndex; i < filters.length;) {
                if (filters[i].field === action.field) {
                    filters.splice(i, 1);
                } else {
                    i++;
                }
            }
        }

        const newFilter: Filter = {
            field: action.field,
            content: [action.content],
            index: filterIndex === -1 ? filters.length : filterIndex,
            onlyFullMatch: true
        };

        if (filterIndex === -1) {
            filters.push(newFilter);
        } else {
            filters[filterIndex] = newFilter;
        }

        return {
            ...state,
            filters,
            operator: 'and' as FilterOperator
        };
    }),
    on(setExcludingFilter, (state, action) => {
        // remove default filter
        const filters = state.filters.filter(filter => !isDefaultFilter(filter));

        // find existing filter on this field
        const filterIndex = filters.findIndex(filter => filter.field === action.field);
        if (filterIndex !== -1) {
            for (let i = filterIndex; i < filters.length;) {
                if (filters[i].field === action.field) {
                    // remove this item from existing filters
                    const content = filters[i].content.filter(c => c !== action.exclude);
                    if (content.length === 0) {
                        filters.splice(i, 1);
                    } else {
                        filters[i] = {
                            ...filters[i],
                            content
                        };
                        i++;
                    }
                } else {
                    i++;
                }
            }
        }
        if (filterIndex === -1) {
            const newFilter: Filter = {
                field: action.field,
                content: action.include.filter(c => c !== action.exclude),
                index: filters.length,
                onlyFullMatch: true
            };

            filters.push(newFilter);
        }

        if (filters.length === 0) {
            // need to have at least one default filter
            filters.push({
                content: [],
                field: '*',
                index: 0,
                onlyFullMatch: false
            });
        }

        return {
            ...state,
            filters,
            operator: <FilterOperator>'and'
        };
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
            filters: filters || initialState.questionnaire.filters
        };
    }),
    on(setMatchedQuestions, (state, action) => {
        const matchedQuestions = new Map<string, MatchedQuestion>();
        const matchedQuestionIds: string[] = [];

        for (const match of action.matchedQuestions) {
            const id = match.id.text;
            matchedQuestionIds.push(id);
            matchedQuestions.set(id, match);
        }
        return {
            ...state,
            matchedQuestions,
            matchedQuestionsCount: matchedQuestionIds.length,
            matchedQuestionIds
        };
    })
)
