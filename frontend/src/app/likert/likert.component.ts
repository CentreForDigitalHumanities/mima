import { Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { Judgment, MatchedJudgment as MatchedJudgment } from '../models/judgment';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { HighlightPipe } from '../highlight.pipe';
import { LuupzigModule } from 'luupzig';
import { JudgmentsService } from '../services/judgments.service';
import { LikertBarComponent } from '../likert-bar/likert-bar.component';
import { IntersectableComponent } from '../services/visibility.service';

interface LikertValues {
    counts: number[],
    total: number
}
@Component({
    selector: 'mima-likert',
    standalone: true,
    imports: [CommonModule, FontAwesomeModule, HighlightPipe, LuupzigModule, LikertBarComponent],
    templateUrl: './likert.component.html',
    styleUrl: './likert.component.scss'
})

export class LikertComponent implements OnChanges, OnDestroy, IntersectableComponent<MatchedJudgment> {
    value: MatchedJudgment;
    @Input() id: string;
    @Input() judgments: ReadonlyMap<string, MatchedJudgment>;
    @Input()
    set model(value: MatchedJudgment) {
        this.value = value;
        this.updateLikertValues();
    }
    get model() {
        return this.value;
    }
    @Input() loading: boolean = false;
    @Input() show: 'count' | 'percentage' = 'count';

    @Output()
    toggleShow = new EventEmitter();

    questionExpanded: boolean = false;
    /**
     * Did the user manually expand this question? Don't automatically close it.
     */
    private manuallyExpanded = false;

    /**
     * Native element used to render this component.
     */
    nativeElement: HTMLElement;

    likertValues: { [dialect: string]: LikertValues } = {};
    likertValuesGeneral: LikertValues;

    dialectNames: string[] = [];


    constructor(private judgmentsService: JudgmentsService, element: ElementRef) {
        this.nativeElement = element.nativeElement;
    }


    ngOnChanges(changes: SimpleChanges): void {
        if (this.id !== this.nativeElement.dataset['id']) {
            // this is used to find the associated data when
            // this component becomes visible
            this.nativeElement.dataset['id'] = this.id;
            this.judgmentsService.registerComponent(this);
        }
    }

    ngOnDestroy(): void {
        this.judgmentsService.unregisterComponent(this);
    }

    /**
     * Initializes the likert values for each dialect as well as the general likert values
     */
    initializeLikertValues() {
        if (this.model) {
            for (const response of this.model.responses) {
                const dialect = response.dialect.text;
                if (!this.likertValues[dialect]) {
                    this.likertValues[dialect] = {
                        counts: [],
                        total: 0
                    };
                    for (let i = 0; i < 5; i++) {
                        this.likertValues[dialect].counts[i] = 0;
                    }
                }
            }
            this.likertValuesGeneral = {
                counts: [],
                total: 0
            };
            for (let i = 0; i < 5; i++) {
                this.likertValuesGeneral.counts[i] = 0;
            }
        }

    }

    updateLikertValues() {
        this.initializeLikertValues();
        for (let response of this.model.responses) {
            const index = Number.parseInt(response.score.text) - 1;
            this.likertValues[response.dialect.text].counts[index]++;
            this.likertValues[response.dialect.text].total++;
            this.likertValuesGeneral.counts[index]++;
            this.likertValuesGeneral.total++;
        }
        this.updateDialectNames();
    }


    updateDialectNames() {
        this.dialectNames = Object.keys(this.likertValues);
    }

    formatQuestion(mainQuestion, subQuestion) {
        if (mainQuestion.includes('…')) {
            return mainQuestion.replace('…', `<strong>${subQuestion}</strong>`);
        } else {
            return `${mainQuestion} <strong>${subQuestion}</strong>`;
        }
    }

    toggleQuestion(): void {
        this.questionExpanded = !this.questionExpanded;
        this.manuallyExpanded = this.questionExpanded;
    }
}
