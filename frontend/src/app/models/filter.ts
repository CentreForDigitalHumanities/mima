import { Adverbial } from './adverbial';

export interface Filter {
    index: number;
    field: '*' | keyof Adverbial;
    content: string[];
}

export type FilterOperator = 'and' | 'or';
