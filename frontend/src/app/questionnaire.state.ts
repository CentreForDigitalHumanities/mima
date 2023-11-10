import { Question } from "./models/question";
import { Filter, FilterOperator } from './models/filter';


export interface State {
    questionnaire: {
        operator: FilterOperator;
        filters: ReadonlyArray<Filter>;
        questions: Map<string, Question>;
        questionIds: ReadonlyArray<string>;
        questionsCount: number;
        matchedQuestions: ReadonlyArray<Question>;
        matchedQuestionIds: ReadonlyArray<string>;
    }
}

export const initialState: State = {
    questionnaire: {
        operator: 'or',
        filters: [{ index: 0, field: '*', content: [] }],
        questions: new Map<string, Question>(),
        questionIds: [],
        questionsCount: 0,
        matchedQuestions: [],
        matchedQuestionIds: []
    }
}
