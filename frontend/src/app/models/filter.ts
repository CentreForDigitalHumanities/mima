import { Adverbial } from './adverbial';
import { Answer } from './answer';
import { Question } from './question';

export interface Filter {
    index: number;
    field: FilterField;
    content: string[];
    /**
     * Require the entire field to match this filter. This is needed when the text content could
     * contain part of this filter. E.g. searching for "Fries" should not match "Westfries"
     */
    onlyFullMatch: boolean;
}

export type FilterField = '*' | keyof Adverbial | keyof Question | keyof Answer;

export type FilterOperator = 'and' | 'or';
