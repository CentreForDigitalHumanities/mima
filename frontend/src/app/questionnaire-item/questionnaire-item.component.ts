import { Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
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
export class QuestionnaireItemComponent implements OnChanges, OnDestroy {
    faCheck = faCheck;
    faChevronDown = faChevronDown;
    faCircleNotch = faCircleNotch;
    faTimes = faTimes;
    faUser = faUser;

    @Input() id: string;
    @Input() questions: Map<string, Question>;
    @Input() loading: boolean;
    @Output() includeFilter = new EventEmitter<FilterEvent>();
    @Output() excludeFilter = new EventEmitter<FilterEvent>();

    dialectsCount = 0;
    matchedQuestion: MatchedQuestion;
    matchedAnswerCount = 0;
    matchedDialects: { [dialect: string]: MatchedAnswer[] } = {};
    matchedDialectNames: string[] = [];
    matchedDialectsCount = 0;
    questionExpanded: boolean = false;

    /**
     * Native element used to render this component.
     */
    nativeElement: HTMLElement;

    @Input()
    set question(value: MatchedQuestion) {
        this.matchedQuestion = value;
        if (value) {
            this.updateCounts();
        }
    }

    /**
     * Is this the only question in a result list?
     */
    @Input()
    onlyQuestion = false;

    constructor(private questionnaireService: QuestionnaireService, element: ElementRef) {
        this.nativeElement = element.nativeElement;
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (this.id !== this.nativeElement.dataset['id']) {
            // this is used to find the associated data when
            // this component becomes visible
            this.nativeElement.dataset['id'] = this.id;
            this.questionnaireService.registerComponent(this);
        }
    }

    ngOnDestroy(): void {
        this.questionnaireService.unregisterComponent(this);
    }


    private updateCounts() {
        if (!this.matchedQuestion?.answers) {
            this.questionExpanded = false;
            return;
        }

        this.matchedDialectNames = this.matchedQuestion.matchedDialectNames;

        this.matchedAnswerCount = this.matchedQuestion.matchedAnswerCount;
        this.matchedDialects = this.matchedQuestion.matchedDialects;
        this.matchedDialectsCount = this.matchedQuestion.matchedDialectsCount;
        this.matchedDialectNames = this.matchedQuestion.matchedDialectNames;
        this.dialectsCount = this.matchedQuestion.dialectsCount;
        this.questionExpanded = this.onlyQuestion ||
            this.matchedDialectsCount <= autoExpandDialectCount ||
            this.matchedAnswerCount <= autoExpandAnswerCount;
    }

    /**
     * emits a filter to be the only filter to the parent component
     * this filter always contains a single filter, i.e. one dialect, one question, or one participant
     */
    onFilterSelected(event: MouseEvent, field: FilterField, content: string) {
        this.includeFilter.emit({ field, content });
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
