import { Answer } from './answer';

export interface Question {
    id: string;
    type: string;
    question: string;
    prompt?: string;
    answers?: Answer[];
}
