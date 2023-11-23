import { MatchedParts } from './adverbial';

export interface Answer {
    questionId: string;
    answer: string;
    answerId: string;
    participantId: string;
    dialect: string;
    ma?: string;
    prompt?: string;
    promptMa?: string;
}

/**
 * Depends on the type of property
 */
type MatchedAnswerValue<T> =
    T extends string
    ? MatchedParts
    : never;

export type MatchedAnswerProperties = {
    [key in keyof Answer]: MatchedAnswerValue<Answer[key]>
};

export class MatchedAnswer implements MatchedAnswerProperties {
    questionId: MatchedParts;
    answer: MatchedParts;
    answerId: MatchedParts;
    participantId: MatchedParts;
    dialect: MatchedParts;
    ma?: MatchedParts;
    prompt?: MatchedParts;
    promptMa?: MatchedParts;

    constructor(answer: Answer) {
        this.questionId = this.unmatchedValue(answer.questionId);
        this.answer = this.unmatchedValue(answer.answer);
        this.answerId = this.unmatchedValue(answer.answerId);
        this.participantId = this.unmatchedValue(answer.participantId);
        this.dialect = this.unmatchedValue(answer.dialect);
        this.ma = this.unmatchedValue(answer.ma);
        this.prompt = this.unmatchedValue(answer.prompt);
        this.promptMa = this.unmatchedValue(answer.promptMa);
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

