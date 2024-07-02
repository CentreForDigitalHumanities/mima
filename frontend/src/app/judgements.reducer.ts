import { createReducer, on } from '@ngrx/store';
import { initialState } from './judgements.state';
import { setJudgements, setMatchedJudgements } from './judgements.actions';
import { MatchedJudgement } from './models/judgement';


export const judgementsReducer = createReducer(
    initialState.judgements,
    on(setJudgements, (state, action) => {
        return {
            ...state,
            judgements: action.judgements
        };
    }),
    on(setMatchedJudgements, (state, action) => {
        const matchedJudgements = new Map<string, MatchedJudgement>();

        for (const match of action.matchedJudgements) {
            const id = match.judgementId.text;
            matchedJudgements.set(id, match);
        }
        return {
            ...state,
            matchedJudgements,
            matchedJudgementsCount: matchedJudgements.size
        };
    })
);
