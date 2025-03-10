import { MatchedParts, MatchedPartsProperties } from './matched-parts';
import { LikertResponse, MatchedLikertResponse, MatchedLikertResponseProperties } from './likert-response';
import { Filterable } from './filter';

export interface Judgment extends Filterable {
    judgmentId: string;
    mainQuestion: string;
    mainQuestionId: string;
    subQuestion: string;
    /**
     * UID for each distinct sub-question text
     */
    subQuestionTextId: string;
    responses: LikertResponse[];
}

type MatchedJudgmentValue<T> =
    T extends string
    ? MatchedParts
    : T extends LikertResponse[]
    ? MatchedLikertResponse[]
    : never;

export type MatchedJudgmentProperties = {
    [key in keyof Judgment]: MatchedJudgmentValue<Judgment[key]>
};

/**
 * Depends on the type of property
 */
type MatchedJudgmentDeserializedValue<T> =
    T extends MatchedParts
    ? MatchedPartsProperties
    : T extends MatchedParts[]
    ? MatchedPartsProperties[]
    : T extends MatchedLikertResponse[]
    ? MatchedLikertResponseProperties[]
    : T extends { [dialect: string]: MatchedLikertResponse[] }
    ? { [dialect: string]: MatchedLikertResponseProperties[] }
    : T;

export type MatchedJudgmentDeserialized = {
    [key in keyof Omit<MatchedJudgment, 'updateCounts'>]: MatchedJudgmentDeserializedValue<MatchedJudgment[key]>
};

export class MatchedJudgment implements MatchedJudgmentProperties {
    judgmentId: MatchedParts;
    mainQuestion: MatchedParts
    mainQuestionId: MatchedParts
    subQuestion: MatchedParts
    subQuestionTextId: MatchedParts
    responses: MatchedLikertResponse[]

    dialectsCount = 0;
    matchedResponses: MatchedLikertResponse[] = [];
    matchedResponseCount = 0;
    matchedDialects: { [dialect: string]: MatchedLikertResponse[] } = {};
    matchedDialectsCount = 0;
    matchedDialectNames: string[] = [];
    /**
     * Matched participant IDs
     */
    matchedParticipants: string[] = [];

    constructor(judgment?: Judgment) {
        if (judgment) {
            this.judgmentId = this.unmatchedValue(judgment.judgmentId);
            this.mainQuestion = this.unmatchedValue(judgment.mainQuestion);
            this.mainQuestionId = this.unmatchedValue(judgment.mainQuestionId);
            this.subQuestion = this.unmatchedValue(judgment.subQuestion);
            this.subQuestionTextId = this.unmatchedValue(judgment.subQuestionTextId);
            this.responses = judgment.responses.map(response => new MatchedLikertResponse(response));
        }
    }

    /**
     * Reconstructs an object from the deserialized value.
     * @param value deserialized value
     * @returns
     */
    static restore(value: MatchedJudgmentDeserialized): MatchedJudgment {
        const properties: Omit<MatchedJudgment, 'updateCounts'> = {
            judgmentId: MatchedParts.restore(value.judgmentId),
            mainQuestion: MatchedParts.restore(value.mainQuestion),
            mainQuestionId: MatchedParts.restore(value.mainQuestionId),
            subQuestion: MatchedParts.restore(value.subQuestion),
            subQuestionTextId: MatchedParts.restore(value.subQuestionTextId),
            responses: value.responses.map(answer => MatchedLikertResponse.restore(answer)),
            dialectsCount: value.dialectsCount,
            matchedResponses: value.matchedResponses.map(r => MatchedLikertResponse.restore(r)),
            matchedResponseCount: value.matchedResponseCount,
            matchedDialects: Object.fromEntries(
                Object.entries(value.matchedDialects)
                    .map(([dialect, answers]) => [dialect, answers.map(a => MatchedLikertResponse.restore(a))])),
            matchedDialectsCount: value.matchedDialectsCount,
            matchedDialectNames: value.matchedDialectNames,
            matchedParticipants: value.matchedParticipants
        };

        return Object.setPrototypeOf(properties, MatchedJudgment.prototype);
    }

    updateCounts() {
        const dialects = new Set<string>();
        const participants = new Set<string>();

        this.matchedResponses = [];
        this.matchedDialects = {};

        for (const response of this.responses) {
            for (const dialect of response.dialects) {
                dialects.add(dialect.text);
            }

            if (response.match) {
                // count matched responses only once
                this.matchedResponses.push(response);
                participants.add(response.participantId.text);

                // did we filter on dialects or on something else?
                let matchedDialectParts = response.dialects.filter(part => part.match);
                if (matchedDialectParts.length === 0) {
                    // we did not filter on dialects, mark all dialects of this answer
                    // as matched
                    matchedDialectParts = response.dialects;
                }

                for (const dialectPart of matchedDialectParts) {
                    const dialect = dialectPart.text;

                    if (dialect in this.matchedDialects) {
                        this.matchedDialects[dialect].push(response);
                    } else {
                        this.matchedDialects[dialect] = [response];
                    }
                }
            }
        }
        this.matchedResponseCount = this.matchedResponses.length;

        this.matchedDialectNames = Object.keys(this.matchedDialects).sort((a, b) => a.localeCompare(b));
        this.matchedDialectsCount = this.matchedDialectNames.length;
        this.matchedParticipants = [...participants];
        this.dialectsCount = dialects.size;
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





