import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faBook } from '@fortawesome/free-solid-svg-icons';
import { ManualComponent } from '../manual/manual.component';
import { ManualService } from '../services/manual.service';

@Component({
    selector: 'mima-manual-button',
    standalone: true,
    imports: [CommonModule, RouterLink, FontAwesomeModule, ManualComponent],
    templateUrl: './manual-button.component.html',
    styleUrl: './manual-button.component.scss'
})
export class ManualButtonComponent {
    isOpen = false;
    faBook = faBook;

    title$: Promise<string>;

    @Input()
    id: string;

    constructor(private manualService: ManualService) {

    }

    open() {
        if (!this.title$) {
            this.title$ = this.manualService.getManualPage(this.id).then(page => page.title);
        }
        this.isOpen = true;
    }

    close() {
        this.isOpen = false;
    }
}
