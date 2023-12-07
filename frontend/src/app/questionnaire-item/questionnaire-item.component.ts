import { Component, EventEmitter, Input, Output } from '@angular/core';
import { faCheck, faChevronDown, faCircleNotch, faTimes, faUser } from '@fortawesome/free-solid-svg-icons';
import { QuestionnaireService } from '../services/questionnaire.service'
import { Question, MatchedQuestion } from '../models/question';
import { MatchedAnswer } from '../models/answer';
import { FilterField } from '../models/filter';

const autoExpandDialectCount = 3;
const autoExpandAnswerCount = 10;

export interface FilterEvent {
    field: FilterField;
    content: string;
}

@Component({
    selector: 'mima-questionnaire-item',
    templateUrl: './questionnaire-item.component.html',
    styleUrls: ['./questionnaire-item.component.scss'],
})
export class QuestionnaireItemComponent {
    faCheck = faCheck;
    faChevronDown = faChevronDown;
    faCircleNotch = faCircleNotch;
    faTimes = faTimes;
    faUser = faUser;

    @Input() id: string;
    @Input() questions: Map<string, Question>;
    @Output() singleFilterSelect = new EventEmitter<FilterEvent>();
    @Output() excludeFilter = new EventEmitter<FilterEvent>();

    dialectsCount = 0;
    matchedQuestion: MatchedQuestion;
    matchedAnswerCount = 0;
    matchedDialects: { [dialect: string]: MatchedAnswer[] } = {};
    matchedDialectNames: string[] = [];
    matchedDialectsCount = 0;
    questionExpanded: boolean = false;

    @Input()
    set question(value: MatchedQuestion) {
        this.matchedQuestion = value;
        this.updateCounts();
    }

    /**
     * Is this the only question in a result list?
     */
    @Input()
    onlyQuestion = false;

    constructor(private questionnaireService: QuestionnaireService) {
    }

    private updateCounts() {
        if (!this.matchedQuestion.answers) {
            this.questionExpanded = false;
            return;
        }

        const dialects = new Set<string>();
        this.matchedDialects = {};

        this.matchedAnswerCount = 0;
        this.matchedDialectsCount = 0;

        for (let answer of this.matchedQuestion.answers) {
            dialects.add(answer.dialect.text);

            if (answer.match) {
                this.matchedAnswerCount++;
                if (answer.dialect.text in this.matchedDialects) {
                    this.matchedDialects[answer.dialect.text].push(answer);
                } else {
                    this.matchedDialects[answer.dialect.text] = [answer];
                    this.matchedDialectsCount++;
                }
            }
        }

        this.matchedDialectNames = Object.keys(this.matchedDialects).sort((a, b) => a.localeCompare(b));
        this.dialectsCount = dialects.size;
        this.questionExpanded = this.onlyQuestion ||
            this.matchedDialectsCount <= autoExpandDialectCount ||
            this.matchedAnswerCount <= autoExpandAnswerCount;
    }

    /**
     * emits a filter to be the only filter to the parent component
     * this filter always contains a single filter, i.e. one dialect, one question, or one participant
     */
    onFilterSelected(event: MouseEvent, field: FilterField, content: string) {
        this.singleFilterSelect.emit({ field, content });
        event.stopPropagation();  // to ensure that the panel does not collapse or expand
    }

    /**
     * emits a filter to be excluded to the parent component
     * params same as for onFilterSelected
     */
    onExcludeFilter(event: MouseEvent, field: FilterField, content: string) {
        this.excludeFilter.emit({ field, content });
        event.stopPropagation();  // to ensure that the panel does not collapse or expand
    }

    toggleQuestion(): void {
        this.questionExpanded = !this.questionExpanded;
    }
}
