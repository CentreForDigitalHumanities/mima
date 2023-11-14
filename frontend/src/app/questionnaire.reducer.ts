import { createReducer, on } from '@ngrx/store';
import { initialState } from './questionnaire.state';
import { setQuestions, updateFilter } from './questionnaire.actions';


export const questionnaireReducer = createReducer(
    initialState.questionnaire,
    on(setQuestions, (state, action) => ({
        ...state,
        questions: action.questions,
        questionsCount: action.questions.size,
        questionIds: Array.from(action.questions.keys())
    })),
    on(updateFilter, (state, action) => {
        const filters = [...state.filters];
        filters[action.filter.index] = action.filter;
        return {
            ...state,
            filters
        };
    }),
)
