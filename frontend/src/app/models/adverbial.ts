export interface Adverbial {
    id: string;
    text: string;
    example: string;
    translation: string;
    gloss: string;
    language: string;
    dialect: string;
    language_family: string;
    language_group: string;
    source: string;
    labels: string[];
    notes: string;
}

/**
 * Part of the text marking highlights.
 */
type MatchedPart = {
    text: string,
    match: boolean
};

/**
 * Part of the text marking highlights.
 */
export type MatchedParts = {
    parts: MatchedPart[],
    /**
     * is there any text?
     */
    empty: boolean,
    /**
     * does the entire text match?
     */
    fullMatch: boolean,
    /**
     * does this text match?
     */
    match: boolean;
    /**
     * empty filters match everything but shouldn't be marked as
     * "hit"
     */
    emptyFilters: boolean;
};

/**
 * Depends on the type of property
 */
type MatchedAdverbialValue<T> =
    T extends string
    ? MatchedParts
    : T extends string[]
    ? MatchedParts[]
    : never;

type MatchedAdverbialProperties = {
    [key in keyof Adverbial]: MatchedAdverbialValue<Adverbial[key]>
};

export class MatchedAdverbial implements MatchedAdverbialProperties {
    id: MatchedParts;
    text: MatchedParts;
    example: MatchedParts;
    translation: MatchedParts;
    gloss: MatchedParts;
    language: MatchedParts;
    dialect: MatchedParts;
    // tslint:disable-next-line:variable-name
    language_family: MatchedParts;
    // tslint:disable-next-line:variable-name
    language_group: MatchedParts;
    source: MatchedParts;
    labels: MatchedParts[];
    notes: MatchedParts;

    constructor(adverbial?: Adverbial) {
        if (adverbial) {
            this.id = this.unmatchedValue(adverbial.id);
            this.text = this.unmatchedValue(adverbial.text);
            this.example = this.unmatchedValue(adverbial.example);
            this.translation = this.unmatchedValue(adverbial.translation);
            this.gloss = this.unmatchedValue(adverbial.gloss);
            this.language = this.unmatchedValue(adverbial.language);
            this.dialect = this.unmatchedValue(adverbial.dialect);
            this.language_family = this.unmatchedValue(adverbial.language_family);
            this.language_group = this.unmatchedValue(adverbial.language_group);
            this.source = this.unmatchedValue(adverbial.source);
            this.labels = adverbial.labels.map(label => this.unmatchedValue(label));
            this.notes = this.unmatchedValue(adverbial.notes);
        }
    }

    private unmatchedValue(text: string): MatchedParts {
        return {
            empty: !(text ?? '').trim(),
            match: false,
            fullMatch: false,
            emptyFilters: true,
            parts: [{
                text,
                match: false
            }]
        };
    }
}
