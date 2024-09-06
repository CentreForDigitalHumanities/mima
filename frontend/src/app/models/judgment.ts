import { MatchedParts, MatchedPartsProperties } from './matched-parts';
import { LikertResponse, MatchedLikertResponse } from './likert-response';

export interface Judgment {
    judgmentId: string;
    mainQuestion: string;
    mainQuestionId: string;
    subQuestion: string;
    subQuestionId: string;
    responses: LikertResponse[];
}

type MatchedJudgmentValue<T> =
    T extends string
    ? MatchedParts
    : T extends LikertResponse[]
    ? MatchedLikertResponse[]
    : never;

export type MatchedJudgmentProperties = {
    [key in keyof Judgment]: MatchedJudgmentValue<Judgment[key]>
};

export class MatchedJudgment implements MatchedJudgmentProperties {
    judgmentId: MatchedParts;
    mainQuestion: MatchedParts
    mainQuestionId: MatchedParts
    subQuestion: MatchedParts
    subQuestionId: MatchedParts
    responses: MatchedLikertResponse[]

    constructor(judgment?: Judgment) {
        if (judgment) {
            this.judgmentId = this.unmatchedValue(judgment.judgmentId);
            this.mainQuestion = this.unmatchedValue(judgment.mainQuestion);
            this.mainQuestionId = this.unmatchedValue(judgment.mainQuestionId);
            this.subQuestion = this.unmatchedValue(judgment.subQuestion);
            this.subQuestionId = this.unmatchedValue(judgment.subQuestionId);
            this.responses = judgment.responses.map(response => new MatchedLikertResponse(response));
        }

    }
    private unmatchedValue(text: string): MatchedParts {
        return new MatchedParts({
            empty: !(text ?? '').trim(),
            match: false,
            fullMatch: false,
            emptyFilters: true,
            parts: [{
                text,
                match: false
            }]
        });
    }

}





