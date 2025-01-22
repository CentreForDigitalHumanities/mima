import { AfterViewInit, Component, EventEmitter, Input, OnChanges, Output, QueryList, ViewChildren } from '@angular/core';
import { FilterEvent, QuestionnaireItemComponent } from '../questionnaire-item/questionnaire-item.component';
import { QuestionnaireService } from '../services/questionnaire.service';
import { MatchedQuestion, Question } from '../models/question';
import { TypedChanges } from '../models/typed-changes';

@Component({
    selector: 'mima-questionnaire-list',
    standalone: true,
    imports: [QuestionnaireItemComponent],
    templateUrl: './questionnaire-list.component.html',
    styleUrl: './questionnaire-list.component.scss'
})
export class QuestionnaireListComponent implements AfterViewInit, OnChanges {
    @ViewChildren(QuestionnaireItemComponent)
    questionComponents!: QueryList<QuestionnaireItemComponent>;

    @Input()
    dialectRoadmap: { [dialect: string]: string };

    @Input()
    questions: ReadonlyMap<string, Question>;

    @Input()
    matchedQuestions: ReadonlyMap<string, MatchedQuestion>;

    @Output()
    includeFilter = new EventEmitter<FilterEvent>();

    @Output()
    excludeFilter = new EventEmitter<FilterEvent>();

    constructor(private questionnaireService: QuestionnaireService) {
    }

    ngAfterViewInit(): void {
        this.questionnaireService.initialize('question', this.questionComponents);
    }

    ngOnChanges(changes: TypedChanges<QuestionnaireListComponent>): void {
        if (changes.matchedQuestions) {
            // when the list of results isn't changed, but the content of the
            // questions themselves could still have been changed
            this.questionnaireService.setModels(this.matchedQuestions);
        }
    }

}
