import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faChartSimple, faPercent } from '@fortawesome/free-solid-svg-icons';
import { LikertShow } from '../likert/likert.component';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'mima-likert-count-toggle',
    standalone: true,
    imports: [CommonModule, FontAwesomeModule],
    templateUrl: './likert-count-toggle.component.html',
    styleUrl: './likert-count-toggle.component.scss'
})
export class LikertCountToggleComponent {
    faChartSimple = faChartSimple;
    faPercent = faPercent;

    @Input()
    show: LikertShow;

    @Output()
    toggleShow = new EventEmitter<void>();
}
