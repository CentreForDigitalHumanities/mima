import { Injectable } from '@angular/core';
import { MatchedQuestion } from '../models/question';
import { MatchedParts } from '../models/matched-parts';
import { ProgressService } from './progress.service';

type QuestionRow = {
    questionPrompt?: MatchedParts,
    questionId?: MatchedParts,
    answer?: MatchedParts,
    participantId?: MatchedParts,
    dialects?: MatchedParts[]
}

const QuestionColumnNames: {
    [T in keyof QuestionRow]: string
} = {
    questionPrompt: $localize`Question Text`,
    questionId: $localize`Question ID`,
    answer: $localize`Translation`,
    participantId: $localize`Participant`,
    dialects: $localize`Dialect`
};

const QuestionColumnOrder: (keyof QuestionRow)[] =
    [
        'questionId',
        'questionPrompt',
        'answer',
        'participantId',
        'dialects'
    ];

@Injectable({
    providedIn: 'root'
})
export class DownloadService {
    constructor(private progressService: ProgressService) { }

    downloadQuestions(matchedQuestions: Iterable<MatchedQuestion>, filename: string): void {
        const progress = this.progressService.start(true);
        try {
            const rows: string[] = [QuestionColumnOrder.map(key => QuestionColumnNames[key]).join(',')];
            for (const question of matchedQuestions) {
                rows.push(...this.formatRows(this.questionsRow(question)));
            }

            this.download(rows.join('\n'), filename);
        }
        finally {
            progress.complete();
        }
    }


    private *formatRows(rows: Iterable<QuestionRow>): Iterable<string> {
        for (const row of rows) {
            yield QuestionColumnOrder.map(column => {
                const cell = row[column];
                if (Array.isArray(cell)) {
                    return cell.map(part => this.formatParts(part)).join('; ');
                }
                return this.formatParts(cell);
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
