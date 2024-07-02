import { Filter, FilterOperator } from './models/filter';
import { Judgement, MatchedJudgement } from './models/judgement';


export interface State {
    judgements: {
        operator: FilterOperator;
        filters: ReadonlyArray<Filter>;
        judgements: Map<string, Judgement>;
        judgementsCount: number;
        matchedJudgements: ReadonlyMap<string, MatchedJudgement>;
    }
}

export const initialState: State = {
    judgements: {
        operator: 'or',
        filters: [{ index: 0, field: '*', content: [], onlyFullMatch: false }],
        judgements: new Map(),
        judgementsCount: 0,
        matchedJudgements: new Map()
    }
}
