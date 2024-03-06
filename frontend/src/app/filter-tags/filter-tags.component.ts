import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';

const ShowMax = 5;

@Component({
    selector: 'mima-filter-tags',
    templateUrl: './filter-tags.component.html',
    styleUrls: ['./filter-tags.component.scss'],
    standalone: true,
    imports: [CommonModule, FontAwesomeModule]
})
export class FilterTagsComponent implements OnChanges {
    display: 'selected' | 'unselected' | 'count' = 'selected';

    faCheck = faCheck;
    faTimes = faTimes;

    @Input()
    labels: { [key: string]: string }

    @Input()
    selected: string[];

    unselected: string[];

    ngOnChanges(): void {
        if (!this.labels || this.selected == undefined) {
            return;
        }

        const unselected: string[] = [];

        for (const key of Object.keys(this.labels)) {
            if (this.selected.indexOf(key) == -1) {
                unselected.push(key);
            }
        }

        this.unselected = unselected;

        if (this.selected.length < ShowMax) {
            this.display = 'selected';
        } else if (this.unselected.length < ShowMax && this.unselected.length > 0) {
            this.display = 'unselected';
        } else {
            this.display = 'count';
        }
    }
}
