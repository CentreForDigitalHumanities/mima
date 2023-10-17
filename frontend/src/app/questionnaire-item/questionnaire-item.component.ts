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

    constructor(private questionnaireService: QuestionnaireService) {  }
}
