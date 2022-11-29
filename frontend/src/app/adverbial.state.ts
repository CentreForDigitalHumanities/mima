import { Adverbial, MatchedAdverbial } from './models/adverbial';
import { Filter, FilterOperator } from './models/filter';
export interface State {
    adverbials: {
        operator: FilterOperator;
        filters: ReadonlyArray<Filter>;
        adverbials: ReadonlyArray<Adverbial>;
        adverbialsCount: number;
        adverbialIds: ReadonlyArray<string>;
        matchedAdverbials: ReadonlyMap<string, MatchedAdverbial>;
        matchedAdverbialsCount: number;
        matchedAdverbialIds: ReadonlyArray<string>;
    };
}

export const initialState: State = {
    adverbials: {
        operator: 'or',
        filters: [{ index: 0, field: '*', text: '' }],
        adverbials: [],
        adverbialsCount: 0,
        adverbialIds: [],
        matchedAdverbials: new Map(),
        matchedAdverbialsCount: 0,
        matchedAdverbialIds: []
    }
};
