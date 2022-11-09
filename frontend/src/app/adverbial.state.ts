import { Adverbial, MatchedAdverbial } from './models/adverbial';
import { Filter } from './models/filter';

export interface State {
    adverbials: {
        filters: ReadonlyArray<Filter>;
        adverbials: ReadonlyArray<Adverbial>;
        adverbialIds: ReadonlyArray<string>;
        matchedAdverbials: ReadonlyMap<string, MatchedAdverbial>;
        matchedAdverbialIds: ReadonlyArray<string>;
    };
}

export const initialState: State = {
    adverbials: {
        filters: [{ index: 0, field: '*', text: '' }],
        adverbials: [],
        adverbialIds: [],
        matchedAdverbials: new Map(),
        matchedAdverbialIds: []
    }
};
