import { createReducer, on } from '@ngrx/store';
import { initialState } from './judgments.state';
import { setJudgments, setMatchedJudgments } from './judgments.actions';
import { MatchedJudgment } from './models/judgment';


export const judgmentsReducer = createReducer(
    initialState.judgments,
    on(setJudgments, (state, action) => {
        return {
            ...state,
            judgments: action.judgments
        };
    }),
    on(setMatchedJudgments, (state, action) => {
        const matchedJudgments = new Map<string, MatchedJudgment>();

        for (const match of action.matchedJudgments) {
            const id = match.judgmentId.text;
            matchedJudgments.set(id, match);
        }
        return {
            ...state,
            matchedJudgments,
            matchedJudgmentsCount: matchedJudgments.size
        };
    })
);
