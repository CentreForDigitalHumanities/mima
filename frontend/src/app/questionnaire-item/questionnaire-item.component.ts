import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { Question, MatchedQuestion } from '../models/question';
import { QuestionnaireService } from '../services/questionnaire.service'
import { faCircleNotch } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'mima-questionnaire-item',
  templateUrl: './questionnaire-item.component.html',
  styleUrls: ['./questionnaire-item.component.scss'],
})
export class QuestionnaireItemComponent {
    faCircleNotch = faCircleNotch;

    @Input() id: string;
    @Input() questions: Map<string,Question>;
    @Input() selectedFilters: Map<string, string[]>
    @Input() singleFilters: Map<string, string>;
    @Output() singleFilterSelect = new EventEmitter<[string, string]>();
    @Output() excludeFilter = new EventEmitter<[string, string]>();

    matchedQuestion: MatchedQuestion;

    @Input()
    set question(value: Question | MatchedQuestion) {
        if (value instanceof MatchedQuestion) {
            this.matchedQuestion = value;
        } else {
            this.matchedQuestion = new MatchedQuestion(value);
        }
    }

    constructor(private questionnaireService: QuestionnaireService) {  }

    /**
     * counts the answers to a question for a specific dialect, given the participant filters
     * @param dialect string of the dialect that needs to be checked
     * @returns boolean
     */
    countAnswersShown(dialect) {
        let count = 0;
        const answers = this.questions.get(this.id)?.answerMap.get(dialect);
        if (answers) {
            for (let answer of answers) {
                if (this.selectedFilters.get('participant')?.includes(answer.participantId)) {
                    count += 1;
                }
            }
        }
        return count
    }

    /**
     * emits a filter to be the only filter to the parent component
     * this filter always contains a single filter, i.e. one dialect, one question, or one participant
     * @param filterType type of filter ('dialect', 'question', or 'participant')
     * @param filter selected filter
     */
    onFilterSelected(event, filterType: string, filter: string) {
        this.singleFilterSelect.emit([filterType, filter]);
        event.stopPropagation();  // to ensure that the panel does not collapse or expand
    }

    /**
     * emits a filter to be excluded to the parent component
     * params same as for onFilterSelected
     */
    onExcludeFilter(event, filterType: string, filter: string) {
        this.excludeFilter.emit([filterType, filter]);
        event.stopPropagation();  // to ensure that the panel does not collapse or expand
    }
}
