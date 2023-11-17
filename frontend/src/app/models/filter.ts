import { Adverbial } from './adverbial';
import { Answer } from './answer';
import { Question } from './question';

export interface Filter {
    index: number;
    field: '*' | keyof Adverbial | keyof Question | keyof Answer;
    content: string[];
}

export type FilterOperator = 'and' | 'or';
