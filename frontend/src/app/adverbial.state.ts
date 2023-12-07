import { Adverbial, MatchedAdverbial } from './models/adverbial';
import { Filter, FilterOperator } from './models/filter';
import { MatchedQuestion } from './models/question';
export interface State {
    adverbials: {
        operator: FilterOperator;
        filters: ReadonlyArray<Filter>;
        adverbials: ReadonlyArray<Adverbial>;
        adverbialsCount: number;
        adverbialIds: ReadonlyArray<string>;
        matchedAdverbials: ReadonlyMap<string, MatchedAdverbial | MatchedQuestion>;
        matchedAdverbialsCount: number;
        matchedAdverbialIds: ReadonlyArray<string>;
    };
}

export const initialState: State = {
    adverbials: {
        operator: 'or',
        filters: [{ index: 0, field: '*', content: [], onlyFullMatch: false }],
        adverbials: [],
        adverbialsCount: 0,
        adverbialIds: [],
        matchedAdverbials: new Map(),
        matchedAdverbialsCount: 0,
        matchedAdverbialIds: []
    }
};
