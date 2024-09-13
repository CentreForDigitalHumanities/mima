import { AfterViewInit, Component, Input, OnChanges, QueryList, SimpleChanges, ViewChildren } from '@angular/core';
import { LikertComponent } from '../likert/likert.component';
import { MatchedJudgment } from '../models/judgment';
import { JudgmentsService } from '../services/judgments.service';


@Component({
    selector: 'mima-likert-list',
    standalone: true,
    imports: [LikertComponent],
    templateUrl: './likert-list.component.html',
    styleUrl: './likert-list.component.scss'
})
export class LikertListComponent implements AfterViewInit, OnChanges {
    show: 'count' | 'percentage' = 'count';

    @Input()
    matchedJudgments: ReadonlyMap<string, MatchedJudgment>;

    @ViewChildren(LikertComponent)
    judgmentComponents!: QueryList<LikertComponent>;

    constructor(private judgmentsService: JudgmentsService) {
    }

    ngAfterViewInit(): void {
        this.judgmentsService.initialize(this.judgmentComponents);
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.matchedJudgments && !changes.matchedJudgments.firstChange) {
            // when the list of results isn't changed, but the content of the
            // judgments themselves could still have been changed
            this.judgmentsService.setModels(this.matchedJudgments);
        }
    }

    toggleShow() {
        this.show = this.show == 'count' ? 'percentage' : 'count';
    }
}
