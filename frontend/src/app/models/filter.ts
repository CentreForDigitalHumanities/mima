import { Adverbial } from './adverbial';
import { Question } from './question';

export interface Filter {
    index: number;
    field: '*' | keyof Adverbial | keyof Question;
    content: string[];
}

export type FilterOperator = 'and' | 'or';
