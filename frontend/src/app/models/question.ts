import { MatchedParts, MatchedPartsProperties } from './matched-parts';
import { Answer, MatchedAnswer, MatchedAnswerProperties } from './answer';
import { Filterable } from './filter';

export interface Question extends Filterable {
    id: string;
    type: string;
    question: string;
    split_item: string;
    chapter: string;
    subtags: string[];
    gloss: string;
    en_translation: string;
    prompt?: string;  // as of yet not implemented because it is identical to question for now
    answers?: Answer[];
}

/**
 * Depends on the type of property
 */
type MatchedQuestionValue<T> =
    T extends string
    ? MatchedParts
    : T extends string[]
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
    answers: MatchedAnswer[];
    split_item: MatchedParts;
    chapter: MatchedParts;
    subtags: MatchedParts[];
    gloss: MatchedParts;
    en_translation: MatchedParts;

    dialectsCount = 0;
    matchedAnswers: MatchedAnswer[] = [];
    matchedAnswerCount = 0;

    /**
     * TODO: still relevant?
     * This only includes the direct matches, not any potential children.
     */
    matchedDialects: { [dialect: string]: MatchedAnswer[] } = {};

    /**
     * This only counts the direct matches, not any potential children.
     */
    matchedDialectsCount = 0;
    matchedDialectNames: string[] = [];
    /**
     * Matched participant IDs
     */
    matchedParticipants: string[] = [];

    constructor(question?: Question) {
        if (question) {
            this.id = this.unmatchedValue(question.id);
            this.type = this.unmatchedValue(question.type);
            this.prompt = this.unmatchedValue(question.prompt);
            this.split_item = this.unmatchedValue(question.split_item);
            this.chapter = this.unmatchedValue(question.chapter);
            this.subtags = question.subtags.map(subtag => this.unmatchedValue(subtag))
            this.prompt = this.unmatchedValue(question.prompt);
            this.answers = question.answers.map(answer => new MatchedAnswer(answer));
        }
    }

    /**
     * Reconstructs an object from the deserialized value.
     * @param value deserialized value
     * @returns
     */
    static restore(value: MatchedQuestionDeserialized): MatchedQuestion {
        const properties: Omit<MatchedQuestion, 'updateCounts'> = {
            id: MatchedParts.restore(value.id),
            type: MatchedParts.restore(value.type),
            question: MatchedParts.restore(value.question),
            prompt: MatchedParts.restore(value.prompt),
            answers: value.answers.map(answer => MatchedAnswer.restore(answer)),
            split_item: MatchedParts.restore(value.split_item),
            chapter: MatchedParts.restore(value.chapter),
            subtags: value.subtags.map(subtag => MatchedParts.restore(subtag)),
            gloss: MatchedParts.restore(value.gloss),
            en_translation: MatchedParts.restore(value.en_translation),
            dialectsCount: value.dialectsCount,
            matchedAnswers: value.matchedAnswers.map(a => MatchedAnswer.restore(a)),
            matchedAnswerCount: value.matchedAnswerCount,
            matchedDialects: Object.fromEntries(
                Object.entries(value.matchedDialects)
                    .map(([dialect, answers]) => [dialect, answers.map(a => MatchedAnswer.restore(a))])),
            matchedDialectsCount: value.matchedDialectsCount,
            matchedDialectNames: value.matchedDialectNames,
            matchedParticipants: value.matchedParticipants
        };

        return Object.setPrototypeOf(properties, MatchedQuestion.prototype);
    }

    updateCounts() {
        const dialects = new Set<string>();
        const participants = new Set<string>();

        this.matchedAnswers = [];
        this.matchedDialects = {};
        for (const answer of this.answers) {
            for (const dialect of answer.dialects) {
                dialects.add(dialect.text);
            }

            if (answer.match) {
                // count matched answers only once
                this.matchedAnswers.push(answer);
                participants.add(answer.participantId.text);

                // did we filter on dialects or on something else?
                let matchedDialectParts = answer.dialects.filter(part => part.match);
                if (matchedDialectParts.length === 0) {
                    // we did not filter on dialects, mark all dialects of this answer
                    // as matched
                    matchedDialectParts = answer.dialects;
                }

                for (const dialectPart of matchedDialectParts) {
                    const dialect = dialectPart.text;

                    if (dialect in this.matchedDialects) {
                        this.matchedDialects[dialect].push(answer);
                    } else {
                        this.matchedDialects[dialect] = [answer];
                    }
                }
            }
        }

        this.matchedAnswerCount = this.matchedAnswers.length;

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

/**
 * Depends on the type of property
 */
type MatchedQuestionDeserializedValue<T> =
    T extends MatchedParts
    ? MatchedPartsProperties
    : T extends MatchedParts[]
    ? MatchedPartsProperties[]
    : T extends MatchedAnswer[]
    ? MatchedAnswerProperties[]
    : T extends { [dialect: string]: MatchedAnswer[] }
    ? { [dialect: string]: MatchedAnswerProperties[] }
    : T;

export type MatchedQuestionDeserialized = {
    [key in keyof Omit<MatchedQuestion, 'updateCounts'>]: MatchedQuestionDeserializedValue<MatchedQuestion[key]>
};
