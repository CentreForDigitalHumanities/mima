import { MatchedParts, MatchedPartsProperties } from './matched-parts';
import { LikertResponse, MatchedLikertResponse } from './likert-response';

export interface Judgement {
    judgementId: string;
    mainQuestion: string;
    mainQuestionId: string;
    subQuestion: string;
    subQuestionId: string;
    responses: LikertResponse[];
}

type MatchedJudgementValue<T> =
    T extends string
    ? MatchedParts
    : T extends LikertResponse[]
    ? MatchedLikertResponse[]
    : never;

export type MatchedJudgementProperties = {
    [key in keyof Judgement]: MatchedJudgementValue<Judgement[key]>
};

export class MatchedJudgement implements MatchedJudgementProperties {
    judgementId: MatchedParts;
    mainQuestion: MatchedParts
    mainQuestionId: MatchedParts
    subQuestion: MatchedParts
    subQuestionId: MatchedParts
    responses: MatchedLikertResponse[]

    constructor(judgement?: Judgement) {
        if (judgement) {
            this.judgementId = this.unmatchedValue(judgement.judgementId);
            this.mainQuestion = this.unmatchedValue(judgement.mainQuestion);
            this.mainQuestionId = this.unmatchedValue(judgement.mainQuestionId);
            this.subQuestion = this.unmatchedValue(judgement.subQuestion);
            this.subQuestionId = this.unmatchedValue(judgement.subQuestionId);
            this.responses = judgement.responses.map(response => new MatchedLikertResponse(response));
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





