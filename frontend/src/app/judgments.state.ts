import { Filter, FilterOperator } from './models/filter';
import { Judgment, MatchedJudgment } from './models/judgment';


export interface State {
    judgments: {
        operator: FilterOperator;
        filters: ReadonlyArray<Filter>;
        judgments: ReadonlyMap<string, Judgment>;
        judgmentsCount: number;
        matchedJudgments: ReadonlyMap<string, MatchedJudgment>;
    }
}

export const initialState: State = {
    judgments: {
        operator: 'or',
        filters: [{ index: 0, field: '*', content: [], onlyFullMatch: false }],
        judgments: new Map(),
        judgmentsCount: 0,
        matchedJudgments: new Map()
    }
}
