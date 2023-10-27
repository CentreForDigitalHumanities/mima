import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { Question } from '../models/question';
import { Answer } from '../models/answer';
import { QuestionnaireService } from '../services/questionnaire.service'
import { Store } from '@ngrx/store';
import { State } from '../questionnaire.state'

@Component({
  selector: 'mima-questionnaire-item',
  templateUrl: './questionnaire-item.component.html',
  styleUrls: ['./questionnaire-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QuestionnaireItemComponent {
    @Input() id: string;
    @Input() questions: Map<string,Question>;
    @Input() selectedFilters: Map<string, string[]>
    @Input() singleFilters: Map<string, string>;
    @Output() singleFilterSelect = new EventEmitter<Array<string>>();

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
     * emits a new filter to the parent component
     * this filter always contains a single filter, i.e. one dialect, one question, or one participant
     * @param filterType type of filter ('dialect', 'question', or 'participant')
     * @param filter selected filter
     */
    filterSelected(event, filterType: string, filter: string) {
        this.singleFilterSelect.emit([filterType, filter]);
        console.log(this.singleFilters.get('dialect') === 'Limburgs (Nederland)');
        event.stopPropagation();  // to ensure that the panel does not collapse or expand
    }
}
