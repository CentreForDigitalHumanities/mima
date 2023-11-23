import { MatchedParts } from './adverbial';
import { Answer, MatchedAnswer } from './answer';

export interface Question {
    id: string;
    type: string;
    question: string;
    prompt?: string;  // as of yet not implemented because it is identical to question for now
    answers?: Answer[];
    answerMap?: Map<string, Answer[]>;
}

/**
 * Depends on the type of property
 */
type MatchedQuestionValue<T> =
    T extends string
    ? MatchedParts
    : T extends string[] // Figure out what to do with Answer[] and answerMap
    ? MatchedParts[]
    : T extends Answer[]
    ? MatchedAnswer[]
    : T extends Map<string, Answer[]>
    ? Map<string, MatchedAnswer[]>
    : never;

export type MatchedQuestionProperties = {
    [key in keyof Question]: MatchedQuestionValue<Question[key]>
};

export class MatchedQuestion implements MatchedQuestionProperties {
    id: MatchedParts;
    type: MatchedParts;
    question: MatchedParts;
    prompt: MatchedParts;
    answers?: MatchedAnswer[];
    answerMap?: Map<string, MatchedAnswer[]>;

    constructor(question?: Question) {
        if (question) {
            this.id = this.unmatchedValue(question.id);
            this.type = this.unmatchedValue(question.type);
            this.prompt = this.unmatchedValue(question.prompt);
            // take the 'answer' strings from the Answer objects
            // this.answers = question.answers?.map(answer => this.unmatchedValue(answer.answer));
            this.answers = question.answers.map(answer => new MatchedAnswer(answer));
            question.answerMap.forEach((answers, dialect) => {
                const unmatchedAnswers = answers.map(answer => new MatchedAnswer(answer));
                this.answerMap.set(dialect, unmatchedAnswers);
            })
        }
    }

    private unmatchedValue(text: string): MatchedParts {
        return new MatchedParts({
            empty: !(text ?? '').trim(),
            match: false,
            fullMatch: false,
            emptyFilters: true,
            parts: [{
                text,
                match: false
            }]
        });
    }
}
