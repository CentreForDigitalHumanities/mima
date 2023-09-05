export interface Adverbial {
    id: string;
    text: string;
    roots: string[];
    examples: string[];
    translations: string[];
    glosses: string[];
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
export type MatchedPart = {
    text: string,
    match: boolean
};

/**
 * Part of the text marking highlights.
 */
export class MatchedParts {
    parts: MatchedPart[];
    /**
     * is there any text?
     */
    empty: boolean;
    /**
     * does the entire text match?
     */
    fullMatch: boolean;
    /**
     * does this text match?
     */
    match: boolean;
    /**
     * empty filters match everything but shouldn't be marked as
     * "hit"
     */
    emptyFilters: boolean;

    get text(): string {
        return this.parts.map(part => part.text).join('');
    }

    constructor(properties: { [T in keyof Omit<MatchedParts, 'text'>]: MatchedParts[T] }) {
        for (const [key, value] of Object.entries(properties)) {
            this[key] = value;
        }
    }
}

/**
 * Depends on the type of property
 */
type MatchedAdverbialValue<T> =
    T extends string
    ? MatchedParts
    : T extends string[]
    ? MatchedParts[]
    : never;

export type MatchedAdverbialProperties = {
    [key in keyof Adverbial]: MatchedAdverbialValue<Adverbial[key]>
};

export class MatchedAdverbial implements MatchedAdverbialProperties {
    id: MatchedParts;
    text: MatchedParts;
    roots: MatchedParts[];
    examples: MatchedParts[];
    translations: MatchedParts[];
    glosses: MatchedParts[];
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
            this.roots = adverbial.roots.map(root => this.unmatchedValue(root));
            this.examples = adverbial.examples.map(example => this.unmatchedValue(example));
            this.translations = adverbial.translations.map(translation => this.unmatchedValue(translation));
            this.glosses = adverbial.glosses.map(gloss => this.unmatchedValue(gloss));
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
