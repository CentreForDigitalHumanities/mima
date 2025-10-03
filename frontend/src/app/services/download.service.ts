import { Injectable } from '@angular/core';
import { MatchedQuestion } from '../models/question';
import { MatchedParts } from '../models/matched-parts';
import { ProgressService } from './progress.service';
import { MatchedJudgment } from '../models/judgment';

type QuestionRow = {
    questionPrompt?: MatchedParts,
    questionId?: MatchedParts,
    answer?: MatchedParts,
    participantId?: MatchedParts,
    dialects?: MatchedParts[]
}

type JudgmentRow = {
    participantId?: MatchedParts,
    dialects?: MatchedParts[],
    score: MatchedParts
}

const QuestionColumnNames: {
    [T in keyof QuestionRow]: string
} = {
    questionPrompt: $localize`Question Text`,
    questionId: $localize`Question ID`,
    answer: $localize`Translation`,
    participantId: $localize`Participant`,
    dialects: $localize`Language+Dialect`
};

const QuestionColumnOrder: (keyof QuestionRow)[] =
    [
        'questionId',
        'questionPrompt',
        'answer',
        'participantId',
        'dialects'
    ];

const JudgmentColumnNames: {
    [T in keyof JudgmentRow]: string
} = {
    participantId: $localize`Participant`,
    dialects: $localize`Language+Dialect`,
    score: $localize`Score`
};

const JudgmentColumnOrder: (keyof JudgmentRow)[] =
    [
        'score',
        'participantId',
        'dialects'
    ];

@Injectable({
    providedIn: 'root'
})
export class DownloadService {
    constructor(private progressService: ProgressService) { }

    downloadJudgments(matchedJudgments: Iterable<MatchedJudgment>, filename: string): void {
        const progress = this.progressService.start(true);
        try {
            const rows: string[] = [JudgmentColumnOrder.map(key => JudgmentColumnNames[key]).join(',')];
            for (const judgment of matchedJudgments) {
                rows.push(...this.formatRows(JudgmentColumnOrder, this.judgmentsRow(judgment)));
            }

            this.download(rows.join('\n'), filename);
        }
        finally {
            progress.complete();
        }
    }

    downloadQuestions(matchedQuestions: Iterable<MatchedQuestion>, filename: string): void {
        const progress = this.progressService.start(true);
        try {
            const rows: string[] = [QuestionColumnOrder.map(key => QuestionColumnNames[key]).join(',')];
            for (const question of matchedQuestions) {
                rows.push(...this.formatRows(QuestionColumnOrder, this.questionsRow(question)));
            }

            this.download(rows.join('\n'), filename);
        }
        finally {
            progress.complete();
        }
    }


    private *formatRows<T extends (QuestionRow|JudgmentRow)>(order: (keyof T)[], rows: Iterable<T>): Iterable<string> {
        for (const row of rows) {
            yield order.map(column => {
                const cell = row[column];
                if (Array.isArray(cell)) {
                    return cell.map(part => this.formatParts(part)).join('; ');
                }
                return this.formatParts(<MatchedParts>cell);
            }).join(',');
        }
    }

    private formatParts(parts?: MatchedParts): string {
        if (!parts || parts.empty) {
            return '';
        }

        const cell = parts.parts.map(p => p.match ? `*${p.text}*` : p.text).join('');
        if (/[,"]/.test(cell)) {
            return `"${cell.replace(/"/g, '""')}"`;
        }

        return cell;
    }

    private *judgmentsRow(judgment: MatchedJudgment): Iterable<JudgmentRow> {
        for (const response of judgment.responses) {
            if (!response.match) {
                continue;
            }

            yield {
                participantId: response.participantId,
                dialects: response.dialects,
                score: response.score
            };
        }
    }

    private *questionsRow(question: MatchedQuestion): Iterable<QuestionRow> {
        for (const answer of question.answers) {
            if (!answer.match) {
                continue;
            }

            yield {
                questionPrompt: question.prompt,
                questionId: question.id,
                answer: answer.answer,
                participantId: answer.participantId,
                dialects: answer.dialects
            };
        }
    }

    private download(data: string, filename: string): void {
        const blob = new Blob([data], {
            type: 'text/csv'
        });

        const element = document.createElement('a');
        element.setAttribute('href', window.URL.createObjectURL(blob));
        element.setAttribute('download', filename);

        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);
    }
}
