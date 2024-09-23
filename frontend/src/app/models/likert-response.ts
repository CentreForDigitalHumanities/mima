import { MatchedParts, MatchedPartsProperties } from "./matched-parts";

export interface LikertResponse {
    participantId: string;
    dialect: string;
    score: number;
}

type MatchedLikertResponseValue<T> =
    T extends string
    ? MatchedParts
    : T extends number
    ? MatchedParts
    : never;

type MatchedLikertResponseDeserializedValue<T> =
    T extends MatchedParts
    ? MatchedPartsProperties
    : T;

export type MatchedLikertResponseProperties = {
    [key in keyof LikertResponse]: MatchedLikertResponseValue<LikertResponse[key]>
} & { match: boolean };

export type MatchedLikertResponseDeserializedProperties = {
    [key in keyof MatchedLikertResponseProperties]: MatchedLikertResponseDeserializedValue<MatchedLikertResponseProperties[key]>
};

export class MatchedLikertResponse implements MatchedLikertResponseProperties {
    participantId: MatchedParts;
    dialect: MatchedParts;
    score: MatchedParts;
    match = false;

    constructor(likertResponse: LikertResponse) {
        this.participantId = this.unmatchedValue(likertResponse.participantId)
        this.dialect = this.unmatchedValue(likertResponse.dialect)
        this.score = this.unmatchedValue(likertResponse.score?.toString());
    }

    /**
     * Reconstructs an object from the deserialized value.
     * @param value deserialized value
     * @returns
     */
    static restore(value: MatchedLikertResponseDeserializedProperties): MatchedLikertResponse {
        const properties: Omit<MatchedLikertResponse, 'unmatchedValue'> = {
            participantId: MatchedParts.restore(value.participantId),
            dialect: MatchedParts.restore(value.dialect),
            score: MatchedParts.restore(value.score),
            match: value.match
        };

        return Object.setPrototypeOf(properties, MatchedLikertResponse.prototype);
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
