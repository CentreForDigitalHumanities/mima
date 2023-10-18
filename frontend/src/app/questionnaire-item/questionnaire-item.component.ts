import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
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

    constructor(private questionnaireService: QuestionnaireService) {  }

    /**
     * checks whether a question has answers from a specific dialect, given the participant filters
     * @param dialect string of the dialect that needs to be checked
     * @returns boolean
     */
    hasParticipants(dialect: string) {
        const answers = this.questions.get(this.id)?.answerMap.get(dialect);
        if (answers) {
            for (let answer of answers) {
                if (this.selectedFilters.get('participant')?.includes(answer.participantId)) {
                    return true
                }
            }
        }
        return false
    }
}
