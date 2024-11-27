import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faBook } from '@fortawesome/free-solid-svg-icons';
import { ManualService } from '../services/manual.service';

@Component({
    selector: 'mima-manual-button',
    standalone: true,
    imports: [CommonModule,  FontAwesomeModule],
    templateUrl: './manual-button.component.html',
    styleUrl: './manual-button.component.scss'
})
export class ManualButtonComponent {
    faBook = faBook;

    @Input()
    id: string;

    @Input()
    tooltip: string;

    @Input()
    showLabel = true;

    constructor(private manualService: ManualService) {

    }

    open() {
        this.manualService.showManualPage(this.id);
    }
}
