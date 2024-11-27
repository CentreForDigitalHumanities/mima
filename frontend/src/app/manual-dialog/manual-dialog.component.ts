import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faBook } from '@fortawesome/free-solid-svg-icons';
import { Subscription } from 'rxjs';
import { ManualService } from '../services/manual.service';
import { ManualComponent } from '../manual/manual.component';

@Component({
    selector: 'mima-manual-dialog',
    standalone: true,
    imports: [CommonModule, RouterLink, FontAwesomeModule, ManualComponent],
    templateUrl: './manual-dialog.component.html',
    styleUrl: './manual-dialog.component.scss'
})
export class ManualDialogComponent implements OnDestroy {
    isOpen = false;
    faBook = faBook;
    title: string;
    id: string;
    subscriptions = new Subscription();

    constructor(manualService: ManualService, router: Router) {
        this.subscriptions.add(router.events.subscribe(() => {
            this.isOpen = false;
        }));

        this.subscriptions.add(manualService.pageEvent.subscribe(event => {
            switch (event.status) {
                case 'show':
                    this.title = event.title;
                    this.id = event.id;
                    this.isOpen = true;
                    break;

                case 'hide':
                    this.isOpen = false;
                    break;
            }
        }));
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }

    close() {
        this.isOpen = false;
    }
}
