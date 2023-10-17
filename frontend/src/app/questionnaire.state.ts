import { Question } from "./models/question";

export interface State {
    questionnaire: {
        questions: Map<string, Question>;
        questionIds: ReadonlyArray<string>;
        questionsCount: number;
        matchedQuestions: ReadonlyArray<Question>;
        matchedQuestionIds: ReadonlyArray<string>;
    }
}

export const initialState: State = {
    questionnaire: {
        questions: new Map<string, Question>(),
        questionIds: [],
        questionsCount: 0,
        matchedQuestions: [],
        matchedQuestionIds: []
    }
}
