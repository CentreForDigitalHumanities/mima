/**
 * Part of the text marking highlights.
 */
export type MatchedPart = {
    text: string,
    match: boolean,
    bold?: boolean
};

export type MatchedPartsProperties = { [T in keyof Omit<MatchedParts, 'text' | 'highlightedText'>]: MatchedParts[T] };

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

    get highlightedText(): string {
        return this.parts.map(part => part.match ? `*${part.text}*` : part.text).join('');
    }

    constructor(properties: MatchedPartsProperties) {
        for (const [key, value] of Object.entries(properties)) {
            this[key] = value;
        }
    }

    /**
     * Reconstructs an object from the deserialized value.
     * @param value deserialized value
     * @returns
     */
    static restore(value: MatchedPartsProperties): MatchedParts {
        return value ? Object.setPrototypeOf(value, MatchedParts.prototype) : undefined;
    }
}
