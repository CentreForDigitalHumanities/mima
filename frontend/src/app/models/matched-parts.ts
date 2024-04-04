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

    get highlightedText(): string {
        return this.parts.map(part => part.match ? `*${part.text}*` : part.text).join('');
    }

    constructor(properties: { [T in keyof Omit<MatchedParts, 'text' | 'highlightedText'>]: MatchedParts[T] }) {
        for (const [key, value] of Object.entries(properties)) {
            this[key] = value;
        }
    }
}
