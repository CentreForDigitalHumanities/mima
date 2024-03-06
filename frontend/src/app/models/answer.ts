import { MatchedParts } from './matched-parts';

export interface Answer {
    questionId: string;
    answer: string;
    answerId: string;
    participantId: string;
    dialect: string;
    attestation: string;  // using a string instead of a boolean to fit into the existing structure
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
    attestation: MatchedParts;
    ma?: MatchedParts;
    prompt?: MatchedParts;
    promptMa?: MatchedParts;
    match = false;

    constructor(answer: Answer) {
        this.questionId = this.unmatchedValue(answer.questionId);
        this.answer = this.unmatchedValue(answer.answer);
        this.answerId = this.unmatchedValue(answer.answerId);
        this.participantId = this.unmatchedValue(answer.participantId);
        this.dialect = this.unmatchedValue(answer.dialect);
        this.attestation = this.unmatchedValue(answer.attestation);
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

