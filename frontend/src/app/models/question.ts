import { MatchedParts } from './matched-parts';
import { Answer, MatchedAnswer } from './answer';

export interface Question {
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
    : T extends string[] // Figure out what to do with Answer[] and answerMap
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
    matchedAnswerCount = 0;
    matchedDialects: { [dialect: string]: MatchedAnswer[] } = {};
    matchedDialectsCount = 0;
    matchedDialectNames: string[] = [];

    constructor(question?: Question) {
        if (question) {
            this.id = this.unmatchedValue(question.id);
            this.type = this.unmatchedValue(question.type);
            this.prompt = this.unmatchedValue(question.prompt);
            this.answers = question.answers.map(answer => new MatchedAnswer(answer));
        }
    }

    updateCounts() {
        const dialects = new Set<string>();

        this.matchedAnswerCount = 0;
        this.matchedDialects = {};

        for (const answer of this.answers) {
            dialects.add(answer.dialect.text);

            if (answer.match) {
                this.matchedAnswerCount++;
                if (answer.dialect.text in this.matchedDialects) {
                    this.matchedDialects[answer.dialect.text].push(answer);
                } else {
                    this.matchedDialects[answer.dialect.text] = [answer];
                }
            }
        }

        this.matchedDialectNames = Object.keys(this.matchedDialects).sort((a, b) => a.localeCompare(b));
        this.matchedDialectsCount = this.matchedDialectNames.length;
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
