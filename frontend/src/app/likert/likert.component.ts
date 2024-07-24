import { Component, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { Judgement, MatchedJudgement } from '../models/judgement';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { HighlightPipe } from '../highlight.pipe';
import { LuupzigModule } from 'luupzig';
import { JudgementsService } from '../services/judgements.service';

@Component({
  selector: 'mima-likert',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, HighlightPipe, LuupzigModule],
  templateUrl: './likert.component.html',
  styleUrl: './likert.component.scss'
})

export class LikertComponent implements OnChanges, OnDestroy {
    matchedJudgement: MatchedJudgement;
    @Input() id: string;
    @Input() judgements: ReadonlyMap<string, MatchedJudgement>;
    @Input()
    set judgement(value: MatchedJudgement) {
        this.matchedJudgement = value;
        this.updateLikertValues();
   }
   @Input() loading: boolean = false;

    /**
     * Native element used to render this component.
     */
    nativeElement: HTMLElement;


    likertValues: {[dialect: string]: {[score: string]: number}} = {};
    widths: {[dialect: string]: string[]} = {};
    xCoordinates: {[dialect: string]: string[]} = {};
    xCoordinatesN: {[dialect: string]: string[]} = {};
    n_responses: {[dialect: string]: number} = {};

    dialectNames: string[] = [];


    constructor(private judgementsService: JudgementsService, element: ElementRef) {
        this.nativeElement = element.nativeElement;
    }


    ngOnChanges(changes: SimpleChanges): void {
        if (this.id !== this.nativeElement.dataset['id']) {
            // this is used to find the associated data when
            // this component becomes visible
            this.nativeElement.dataset['id'] = this.id;
            this.judgementsService.registerComponent(this);
        }
    }

    ngOnDestroy(): void {
        this.judgementsService.unregisterComponent(this);
    }

    initializeLikertValues() {
        if (this.matchedJudgement) {
            for (let response of this.matchedJudgement.responses) {
                let dialect = response.dialect.text;
                let score = response.score.text;
                if (!this.likertValues[dialect]) {
                    this.likertValues[dialect] = {};
                    for (let i = 1; i <= 5; i++) {
                        this.likertValues[dialect][i.toString()] = 0;
                    }
                }
            }
        }
    };

    updateDialectNames() {
        this.dialectNames = Object.keys(this.likertValues);
    }

    updateLikertValues() {
        this.initializeLikertValues();
        for (let response of this.matchedJudgement.responses) {
            let dialect = response.dialect.text;
            let score = response.score.text;
            this.likertValues[response.dialect.text][response.score.text] += 1;
        }
        this.calculateWidths();
        this.calculateXCoordinates();
        this.updateDialectNames();
    }

    initializeWidths() {
        for (let dialect of Object.keys(this.likertValues)) {
            this.widths[dialect] = ['0%','0%','0%','0%','0%'];
        }
    }

    initializeXCoordinates() {
        for (let dialect of Object.keys(this.likertValues)) {
            this.xCoordinates[dialect] = ['0%','0%','0%','0%','0%'];
            this.xCoordinatesN[dialect] = ['0%','0%','0%','0%','0%'];
        }
    }

    calculateWidths() {
        this.initializeWidths();
        for (let dialect of Object.keys(this.likertValues)) {
            this.n_responses[dialect] = Object.values(this.likertValues[dialect]).reduce((sum, count) => sum + count, 0);
            this.widths[dialect] = Object.keys(this.likertValues[dialect]).map(
                score => (this.likertValues[dialect][score] / this.n_responses[dialect] * 100).toFixed(2) + "%");
        }
    }

    convertToNumber(percentage_string: string) {
        return Number(percentage_string.replace('%', ''))
    }

    convertToNumbers(string_array: string[]) {
        let number_array = [];
        for (let item of string_array) {
            number_array.push(this.convertToNumber(item));
        }
        return number_array;
    }

    convertToPercentages(number_array: number[]) {
        let string_array = [];
        for (let item of number_array) {
            string_array.push(item.toFixed(2) + "%");
        }
        return string_array;
    }

    calculateXCoordinates() {
        this.initializeXCoordinates();
        for (let dialect of Object.keys(this.likertValues)) {
            let xCoordinatesNumbers = [0] // initialize the first value to 0
            let xCoordinatesNumbersN = [(this.convertToNumber(this.widths[dialect][0])/2)]
            for (let i = 1; i <= 4; i++) {
                let sumarray = this.convertToNumbers(this.widths[dialect].slice(0, i));
                xCoordinatesNumbers[i] = (sumarray.reduce((sum, count) => sum + count, 0));
                xCoordinatesNumbersN[i] = xCoordinatesNumbers[i] + (this.convertToNumber(this.widths[dialect][i])/2)
            }
            this.xCoordinates[dialect] = this.convertToPercentages(xCoordinatesNumbers);
            this.xCoordinatesN[dialect] = this.convertToPercentages(xCoordinatesNumbersN);
        }
    }

    formatQuestion(mainQuestion, subQuestion) {
        if (mainQuestion.includes('…')) {
            return mainQuestion.replace('…', `<strong>${subQuestion}</strong>`);
        } else {
            return `${mainQuestion} <strong>${subQuestion}</strong>`;
        }
    }

}
