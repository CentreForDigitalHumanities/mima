import { Question, MatchedQuestion } from "./models/question";
import { MatchedAdverbial } from "./models/adverbial";
import { Filter, FilterOperator } from './models/filter';


export interface State {
    questionnaire: {
        operator: FilterOperator;
        filters: ReadonlyArray<Filter>;
        questions: Map<string, Question>;
        questionIds: ReadonlyArray<string>;
        questionsCount: number;
        matchedQuestions: ReadonlyMap<string, MatchedAdverbial|MatchedQuestion>;
        matchedQuestionIds: ReadonlyArray<string>;
    }
}

export const initialState: State = {
    questionnaire: {
        operator: 'or',
        filters: [{ index: 0, field: '*', content: [], onlyFullMatch: false }],
        questions: new Map<string, Question>(),
        questionIds: [],
        questionsCount: 0,
        matchedQuestions: new Map(),
        matchedQuestionIds: []
    }
}
