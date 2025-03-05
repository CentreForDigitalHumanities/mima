import { IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { Answer } from './answer';
import { MatchedQuestion, Question } from './question';
import { Judgment, MatchedJudgment } from './judgment';
import { LikertResponse } from './likert-response';

/**
 * Marks filterable main objects
 */
export interface Filterable {
}

type FilterManifest = {
    question: {
        keys: keyof Question | keyof Answer;
        type: Question;
        matchType: MatchedQuestion;
    };
    judgment: {
        keys: keyof Judgment | keyof LikertResponse;
        type: Judgment;
        matchType: MatchedJudgment;
    }
}

export type FilterObjectName = keyof FilterManifest;
export type FilterKeys = {
    [T in keyof FilterManifest]: FilterManifest[T]['keys']
};


export interface Filter<T extends FilterObjectName> {
    index: number;
    field: FilterField<T>;
    content: string[];
    /**
     * Require the entire field to match this filter. This is needed when the text content could
     * contain part of this filter. E.g. searching for "Fries" should not match "Westfries"
     */
    onlyFullMatch: boolean;
}

export type FilterField<T extends FilterObjectName> = '*' | FilterManifest[T]['keys'];

export type FilterOperator = 'and' | 'or';

export type FilterType<T extends FilterObjectName> = {
    name: string,
    field: FilterField<T>,
    icon: IconDefinition,
    placeholder: string,
    mode: 'text' | 'dropdown' | 'dialect',
    /**
     * ID of the manual page
     */
    manual?: string
};

export type FilterObject<T extends FilterObjectName> = FilterManifest[T]['type'];
export type FilterMatchedObject<T extends FilterObjectName> = FilterManifest[T]['matchType'];
