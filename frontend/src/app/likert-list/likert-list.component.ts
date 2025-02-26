import { AfterViewInit, Component, EventEmitter, Input, OnChanges, Output, QueryList, SimpleChanges, ViewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LikertComponent, LikertShow } from '../likert/likert.component';
import { Judgment, MatchedJudgment } from '../models/judgment';
import { JudgmentsService } from '../services/judgments.service';
import { DialectLookup } from '../models/dialect';


@Component({
    selector: 'mima-likert-list',
    standalone: true,
    imports: [CommonModule, LikertComponent],
    templateUrl: './likert-list.component.html',
    styleUrl: './likert-list.component.scss'
})
export class LikertListComponent implements AfterViewInit, OnChanges {
    @Input()
    show: LikertShow;

    @Input()
    judgments: ReadonlyMap<string, Judgment>;

    @Input()
    matchedJudgments: ReadonlyMap<string, MatchedJudgment>;

     @Input()
    dialectLookup: DialectLookup;

    @Output()
    toggleShow = new EventEmitter<{}>();

    @ViewChildren(LikertComponent)
    judgmentComponents!: QueryList<LikertComponent>;

    constructor(private judgmentsService: JudgmentsService) {
    }

    ngAfterViewInit(): void {
        this.judgmentsService.initialize('judgment', this.judgmentComponents);
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.matchedJudgments) {
            // when the list of results isn't changed, but the content of the
            // judgments themselves could still have been changed
            this.judgmentsService.setModels(this.matchedJudgments);
        }
    }
}
