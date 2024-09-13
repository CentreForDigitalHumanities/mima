import { AfterViewInit, Component, EventEmitter, Input, NgZone, OnChanges, OnDestroy, Output, QueryList, SimpleChanges, ViewChildren } from '@angular/core';
import { FilterEvent, QuestionnaireItemComponent } from '../questionnaire-item/questionnaire-item.component';
import { Subject, Subscription, throttleTime } from 'rxjs';
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
    questions: Map<string, Question>;

    @Input()
    matchedQuestions: Map<string, MatchedQuestion> | ReadonlyMap<string, MatchedQuestion>;

    @Output()
    includeFilter = new EventEmitter<FilterEvent>();

    @Output()
    excludeFilter = new EventEmitter<FilterEvent>();

    constructor(private questionnaireService: QuestionnaireService, private ngZone: NgZone) {
    }

    ngAfterViewInit(): void {
        this.questionnaireService.initialize(this.questionComponents);
    }

    ngOnChanges(changes: TypedChanges<QuestionnaireListComponent>): void {
        if (changes.matchedQuestions) {
            // when the list of results isn't changed, but the content of the
            // questions themselves could still have been changed
            this.questionnaireService.setModels(this.matchedQuestions);
        }
    }

}
