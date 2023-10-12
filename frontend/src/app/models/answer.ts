export interface Answer {
    questionId: string;
    answer: string;
    participantId: string;
    dialect: string;
    ma?: string;
    prompt?: string;
    promptMa?: string;
}
