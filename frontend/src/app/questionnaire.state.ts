import { Question, MatchedQuestion } from "./models/question";
import { Filter, FilterOperator } from './models/filter';
import { FilterState } from "./filter.state";


export interface State extends FilterState<'questionnaire', 'question'> {
    questionnaire: {
        operator: FilterOperator;
        filters: ReadonlyArray<Filter<'question'>>;
        questions: ReadonlyMap<string, Question>;
        questionsCount: number;
        matchedQuestions: ReadonlyMap<string, MatchedQuestion>;
    }
}

export const initialState: State = {
    questionnaire: {
        operator: 'or',
        filters: [{ index: 0, field: '*', content: [], onlyFullMatch: false }],
        questions: new Map(),
        questionsCount: 0,
        matchedQuestions: new Map()
    }
}
