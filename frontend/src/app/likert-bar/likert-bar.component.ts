import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';

interface BarSegment {
    /**
     * One-based segment number
     */
    n: number,
    /**
     * Offset x percentage with % sign
     */
    x: string,
    /**
     * Offset x to the center of the bar with % sign
     */
    middle: number,
    /**
     * Percentage with % sign
     */
    percentage: string,
    percentageRound: string;
    count: number
}

@Component({
    selector: 'mima-likert-bar',
    standalone: true,
    imports: [],
    templateUrl: './likert-bar.component.html',
    styleUrl: './likert-bar.component.scss'
})
export class LikertBarComponent implements OnChanges {
    segments: BarSegment[];
    totalWidth = 800;

    @Input()
    show: 'count' | 'percentage' = 'count';

    @Input()
    counts: number[];

    @Input()
    total: number;

    @Output()
    toggleShow = new EventEmitter();

    ngOnChanges(changes: SimpleChanges): void {
        this.segments = [];
        if (!this.counts || !this.total) {
            return;
        }
        let x = 0;
        for (let i = 0; i < this.counts.length; i++) {
            const count = this.counts[i];
            const percentage = ((count / this.total) * 100);
            this.segments.push({
                x: `${x.toFixed(2)}%`,
                n: i + 1,
                count,
                middle: ((x + percentage * 0.5) / 100) * this.totalWidth,
                percentage: `${percentage.toFixed(2)}%`,
                // not enough room for a %
                percentageRound: percentage.toFixed(0) + (percentage < 3 ? '' : '%'),
            });
            x += percentage;
        }
    }
}
