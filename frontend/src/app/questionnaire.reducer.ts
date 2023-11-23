import { createReducer, on } from '@ngrx/store';
import { initialState } from './questionnaire.state';
import { setMatchedQuestions, setQuestions, updateFilter } from './questionnaire.actions';
import { MatchedQuestion } from './models/question';


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
    on(setMatchedQuestions, (state, action) => {
        const matchedQuestions = new Map<string, MatchedQuestion>();
        const matchedQuestionIds: string[] = [];

        for (const match of action.matchedQuestions) {
            const id = match.id.text;
            matchedQuestionIds.push(id);
            matchedQuestions[id] = match;
        }
        return {
            ...state,
            matchedQuestions,
            matchedQuestionsCount: matchedQuestionIds.length,
            matchedQuestionIds
        };
    })
)
