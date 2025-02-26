import { Component, ElementRef, EventEmitter, Input, NgZone, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { Judgment, MatchedJudgment as MatchedJudgment } from '../models/judgment';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { HighlightPipe } from '../highlight.pipe';
import { LuupzigModule } from 'luupzig';
import { JudgmentsService } from '../services/judgments.service';
import { LikertBarComponent } from '../likert-bar/likert-bar.component';
import { IntersectableComponent } from '../services/visibility.service';
import { MatchedPart, MatchedParts } from '../models/matched-parts';
import { LoadingComponent } from "../loading/loading.component";
import { DialectLookup } from '../models/dialect';

export type LikertShow = 'count' | 'percentage';

interface LikertValues {
    counts: number[],
    total: number
}
@Component({
    selector: 'mima-likert',
    standalone: true,
    imports: [CommonModule, FontAwesomeModule, HighlightPipe, LuupzigModule, LikertBarComponent, LoadingComponent],
    templateUrl: './likert.component.html',
    styleUrl: './likert.component.scss'
})

export class LikertComponent implements OnChanges, OnDestroy, IntersectableComponent<MatchedJudgment> {
    value: MatchedJudgment;
    @Input() id: string;
    @Input() judgments: ReadonlyMap<string, Judgment>;
    @Input()
    set model(value: MatchedJudgment) {
        this.value = value;
        this.updateLikertValues();
    }
    get model() {
        return this.value;
    }
    @Input() loading: boolean = false;
    @Input() show: LikertShow = 'count';
    @Input() dialectLookup: DialectLookup;


    @Output()
    toggleShow = new EventEmitter();

    questionExpanded: boolean = false;
    /**
     * Did the user manually expand this question? Don't automatically close it.
     */
    private manuallyExpanded = false;

    /**
     * First show the totals when opening the bars, this way they will animate
     * into their specific numbers
     */
    showTotal = true;

    /**
     * After collapsing the list of likert bars, the total should be animated up
     */
    animateUp = false;

    /**
     * Native element used to render this component.
     */
    nativeElement: HTMLElement;

    likertValues: { [dialect: string]: LikertValues } = {};
    likertValuesGeneral: LikertValues;

    dialectNames: string[] = [];
    matchedDialects = new Set<string>();

    constructor(private judgmentsService: JudgmentsService, element: ElementRef, private ngZone: NgZone) {
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
            this.matchedDialects = new Set();
            this.likertValues = {};
            for (const response of this.model.responses) {
                for (const dialect of response.dialects) {
                    if (!this.likertValues[dialect.text]) {
                        this.likertValues[dialect.text] = {
                            counts: [],
                            total: 0
                        };
                        for (let i = 0; i < 5; i++) {
                            this.likertValues[dialect.text].counts[i] = 0;
                        }
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
        if (this.model?.responses) {
            for (const response of this.model.responses) {
                if (!response.match) {
                    continue;
                }
                const index = Number.parseInt(response.score.text) - 1;
                const dialects = response.dialects;
                for (const dialect of dialects) {
                    this.likertValues[dialect.text].counts[index]++;
                    this.likertValues[dialect.text].total++;
                    this.likertValuesGeneral.counts[index]++;
                    this.likertValuesGeneral.total++;
                    this.matchedDialects.add(dialect.text);
                }
            }
        }
        this.updateDialectNames();
    }

    updateDialectNames() {
        this.dialectNames = Object.keys(this.likertValues);
    }

    formatQuestion(mainQuestion: MatchedParts, subQuestion: MatchedParts): MatchedParts {
        const parts: MatchedPart[] = [...mainQuestion.parts];

        let inserted = false;

        for (let i = 0; i < parts.length; i++) {
            let targetIndex = parts[i].text.indexOf('…');
            const part = parts[i];
            if (targetIndex < 0) {
                continue;
            }

            // split after this?
            if (part.text.length > targetIndex + 1) {
                parts.splice(i + 1, 0, {
                    text: part.text.substring(targetIndex + 1),
                    match: part.match
                });
            }
            parts.splice(i, 1, ...[
                {
                    // split before
                    text: part.text.substring(0, targetIndex),
                    match: part.match
                },
                ...subQuestion.parts.map(p => ({ ...p, bold: true }))]);

            inserted = true;
            break;
        }

        if (!inserted) {
            parts.push(
                { match: false, text: ' ', bold: false },
                ...subQuestion.parts.map(p => ({ ...p, bold: true })));
        }

        const result = new MatchedParts({
            parts,
            empty: false,
            emptyFilters: mainQuestion.emptyFilters,
            fullMatch: mainQuestion.fullMatch && subQuestion.fullMatch,
            match: mainQuestion.match || subQuestion.match
        });

        return result;
    }

    toggleQuestion(): void {
        this.questionExpanded = !this.questionExpanded;
        this.manuallyExpanded = this.questionExpanded;

        this.showTotal = true;

        if (this.questionExpanded) {
            this.animateUp = false;
            setTimeout(() => {
                this.ngZone.run(() => {
                    this.showTotal = false;
                });
            }, 50);
        } else {
            this.animateUp = true;
        }
    }
}
