import { Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCheck, faChevronDown, faTimes, faUser } from '@fortawesome/free-solid-svg-icons';
import { LuupzigModule } from 'luupzig';
import { QuestionnaireService } from '../services/questionnaire.service'
import { Question, MatchedQuestion } from '../models/question';
import { MatchedAnswer } from '../models/answer';
import { FilterField } from '../models/filter';
import { HighlightPipe } from '../highlight.pipe';
import { MatchedParts } from '../models/matched-parts';
import { IntersectableComponent } from '../services/visibility.service';
import { LoadingComponent } from "../loading/loading.component";
import { DialectLookup, EndDialects } from '../models/dialect';

const autoExpandDialectCount = 3;
const autoExpandAnswerCount = 10;

export interface FilterEvent {
    field: FilterField<'question'>;
    content: string;
}

/**
 * Matched answers grouped by their text
 */
interface MatchedAnswerGrouped {
    text: string;
    answer: MatchedParts;
    attestation: MatchedParts;
    // dialectPath: string;
    // dialectPathParts: MatchedParts[];
    participantIds: MatchedParts[];
}

@Component({
    selector: 'mima-questionnaire-item',
    templateUrl: './questionnaire-item.component.html',
    styleUrls: ['./questionnaire-item.component.scss'],
    imports: [CommonModule, FontAwesomeModule, HighlightPipe, LuupzigModule, LoadingComponent],
    standalone: true
})
export class QuestionnaireItemComponent implements OnChanges, OnDestroy, IntersectableComponent<MatchedQuestion> {
    /**
     * Did the user manually expand this question? Don't automatically close it.
     */
    private manuallyExpanded = false;

    faCheck = faCheck;
    faChevronDown = faChevronDown;
    faTimes = faTimes;
    faUser = faUser;

    @Input() id: string;
    @Input() questions: ReadonlyMap<string, Question>;
    @Input() loading = false;
    @Input() endDialects: EndDialects;
    @Input() dialectLookup: DialectLookup;
    @Output() includeFilter = new EventEmitter<FilterEvent>();
    @Output() excludeFilter = new EventEmitter<FilterEvent>();

    dialectsCount = 0;
    value: MatchedQuestion;
    /**
     * Should the counts be updated?
     */
    valueDirty = true;
    matchedAnswerCount = 0;
    matchedDialects: { [dialect: string]: MatchedAnswerGrouped[] } = {};
    matchedDialectNames: string[] = [];
    matchedDialectsCount = 0;
    questionExpanded: boolean = false;

    /**
     * Native element used to render this component.
     */
    nativeElement: HTMLElement;

    @Input()
    set model(value: MatchedQuestion) {
        this.value = value;
        if (value) {
            this.valueDirty = true;
            this.updateCounts();
        }
    }
    get model() {
        return this.value;
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

        this.updateCounts();
    }

    ngOnDestroy(): void {
        this.questionnaireService.unregisterComponent(this);
    }


    private async updateCounts() {
        if (!this.valueDirty || !this.endDialects) {
            return;
        }

        this.valueDirty = false;

        if (!this.model?.answers) {
            // once the question is hidden - reset the state
            this.manuallyExpanded = false;
            this.questionExpanded = false;
            return;
        }

        this.matchedAnswerCount = this.model.matchedAnswerCount;
        this.matchedDialects = await this.groupAnswers(this.model.matchedAnswers);
        this.matchedDialectsCount = this.model.matchedDialectsCount;
        this.matchedDialectNames = this.model.matchedDialectNames;
        this.dialectsCount = this.model.dialectsCount;
        if (!this.manuallyExpanded) {
            this.questionExpanded = this.onlyQuestion ||
                this.matchedDialectsCount <= autoExpandDialectCount ||
                this.matchedAnswerCount <= autoExpandAnswerCount;
        }
    }

    private async groupAnswers(matchedAnswers: MatchedQuestion['matchedAnswers']): Promise<{ [dialect: string]: MatchedAnswerGrouped[] }> {
        // group answers by their dialect
        const matchedDialects: { [endDialects: string]: MatchedAnswer[] } = {};

        for (const answer of matchedAnswers) {
            for (const dialect of this.endDialects[answer.participantId.text]) {
                if (this.questionnaireService.anyDialectInPaths(
                    answer.dialects.filter(x => x.match).map(x => x.text),
                    await this.questionnaireService.getDialectPaths(dialect))) {
                    matchedDialects[dialect] = [...matchedDialects[dialect] ?? [], answer];
                }
            }
        }

        // then group them by their text
        const grouped: { [endDialects: string]: MatchedAnswerGrouped[] } = {};

        for (const [dialect, answers] of Object.entries(matchedDialects)) {
            const dialectGroup: { [text: string]: MatchedAnswer[] } = {};
            for (const answer of answers) {
                const text = answer.answer.text;
                if (text in dialectGroup) {
                    dialectGroup[text].push(answer);
                } else {
                    dialectGroup[text] = [answer];
                }
            }
            // const dialectPath = this.dialectLookup.hierarchy[dialect].
            // const dialectPathParts = this.get_parts_from_path(dialectPath);
            // sort by text; put unattested last
            grouped[dialect] = [...Object.entries(dialectGroup)].sort(([textA], [textB]) =>
                textA === ''
                    ? 1
                    : textB === ''
                        ? -1
                        : textA.localeCompare(textB)
            ).map(([text, answers]) => ({
                text,
                answer: answers[0].answer,
                attestation: answers[0].attestation,
                // dialectPath: dialectPath,
                // dialectPathParts: dialectPathParts,
                dialects: answers[0].dialects,
                participantIds: answers.map(answer => answer.participantId)
            }));
        }
        return grouped;
    }

    // private get_parts_from_path(path: string): MatchedParts[] {
    //     // TODO temporary ai solution, will be replace
    //     const parts = path.split('>');
    //     return parts.map(part => new MatchedParts({
    //         empty: false,
    //         match: true,
    //         fullMatch: true,
    //         emptyFilters: false,
    //         parts: [{ text: part, match: true }]
    //     }));
    // }

    /**
     * emits a filter to be the only filter to the parent component
     * this filter always contains a single filter, i.e. one dialect, one question, or one participant
     */
    onFilterSelected(event: MouseEvent, field: FilterField<'question'>, content: string) {
        this.includeFilter.emit({ field, content });
        event.stopPropagation();  // to ensure that the panel does not collapse or expand
    }

    /**
     * emits a filter to be excluded to the parent component
     * params same as for onFilterSelected
     */
    onExcludeFilter(event: MouseEvent, field: FilterField<'question'>, content: string) {
        this.excludeFilter.emit({ field, content });
        event.stopPropagation();  // to ensure that the panel does not collapse or expand
    }

    toggleQuestion(): void {
        this.questionExpanded = !this.questionExpanded;
        this.manuallyExpanded = this.questionExpanded;
    }
}
