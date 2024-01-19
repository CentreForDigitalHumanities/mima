import { Injectable } from '@angular/core';
import { MatchedQuestion } from '../models/question';
import { MatchedParts } from '../models/adverbial';

type QuestionRow = {
    questionPrompt?: MatchedParts,
    questionId?: MatchedParts,
    answer?: MatchedParts,
    participantId?: MatchedParts,
    dialect?: MatchedParts
}

const QuestionColumnNames: {
    [T in keyof QuestionRow]: string
} = {
    questionPrompt: $localize`Question Text`,
    questionId: $localize`Question ID`,
    answer: $localize`Translation`,
    participantId: $localize`Participant`,
    dialect: $localize`Dialect`
};

const QuestionColumnOrder: (keyof QuestionRow)[] =
    [
        'questionId',
        'questionPrompt',
        'answer',
        'participantId',
        'dialect'
    ];

@Injectable({
    providedIn: 'root'
})
export class DownloadService {
    downloadQuestions(matchedQuestions: Iterable<MatchedQuestion>): void {
        const rows: string[] = [QuestionColumnOrder.map(key => QuestionColumnNames[key]).join(',')];
        for (const question of matchedQuestions) {
            rows.push(...this.formatRows(this.questionsRow(question)));
        }

        this.download(rows.join('\n'));
    }


    private *formatRows(rows: Iterable<QuestionRow>): Iterable<string> {
        for (const row of rows) {
            yield QuestionColumnOrder.map(column => this.formatParts(row[column])).join(',');
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
                dialect: answer.dialect
            };
        }
    }

    private download(data: string): void {
        const blob = new Blob([data], {
            type: 'text/csv'
        });

        const element = document.createElement('a');
        element.setAttribute('href', window.URL.createObjectURL(blob));
        element.setAttribute('download', 'results.csv');

        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);
    }
}
