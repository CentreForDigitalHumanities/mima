import { createReducer, on } from '@ngrx/store';
import { initialState } from './questionnaire.state';
import { setQuestions } from './questionnaire.actions';


export const questionnaireReducer = createReducer(
    initialState.questionnaire,
    on(setQuestions, (state, action) => ({
        ...state,
        questions: action.questions,
        questionsCount: action.questions.size,
        questionIds: Array.from(action.questions.keys())
    })),
)
