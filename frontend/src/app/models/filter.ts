import { Adverbial } from './adverbial';
import { Answer } from './answer';
import { Question } from './question';

export interface Filter {
    index: number;
    field: FilterField;
    content: string[];
    onlyFullMatch: boolean;
}

export type FilterField = '*' | keyof Adverbial | keyof Question | keyof Answer;

export type FilterOperator = 'and' | 'or';
