import { Adverbial } from './adverbial';

export interface Filter {
    index: number;
    field: '*' | keyof Adverbial;
    text: string;
}

export type FilterOperator = 'and' | 'or';
