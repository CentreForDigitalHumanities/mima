import { MatchedParts, MatchedPartsProperties } from './matched-parts';

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

type MatchedAnswerDeserializedValue<T> =
    T extends MatchedParts
    ? MatchedPartsProperties
    : T;

export type MatchedAnswerProperties = {
    [key in keyof Answer]: MatchedAnswerValue<Answer[key]>
} & { match: boolean };

export type MatchedAnswerDeserializedProperties = {
    [key in keyof MatchedAnswerProperties]: MatchedAnswerDeserializedValue<MatchedAnswerProperties[key]>
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

    /**
     * Reconstructs an object from the deserialized value.
     * @param value deserialized value
     * @returns
     */
    static restore(value: MatchedAnswerDeserializedProperties): MatchedAnswer {
        const properties: Omit<MatchedAnswer, 'unmatchedValue'> = {
            questionId: MatchedParts.restore(value.questionId),
            answer: MatchedParts.restore(value.answer),
            answerId: MatchedParts.restore(value.answerId),
            participantId: MatchedParts.restore(value.participantId),
            dialect: MatchedParts.restore(value.dialect),
            attestation: MatchedParts.restore(value.attestation),
            ma: MatchedParts.restore(value.ma),
            prompt: MatchedParts.restore(value.prompt),
            promptMa: MatchedParts.restore(value.promptMa),
            match: value.match
        };

        return Object.setPrototypeOf(properties, MatchedAnswer.prototype);
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

