import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ProgressService } from '../services/progress.service';

@Component({
    selector: 'mima-progress',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './progress.component.html',
    styleUrl: './progress.component.scss'
})
export class ProgressComponent implements OnDestroy {
    progress = 0;
    hide = true;
    indeterminate = false;

    private subscription = new Subscription();

    constructor(progressService: ProgressService) {
        this.subscription.add(
            progressService.value$.subscribe(value => {
                setTimeout(() => {
                    switch (value) {
                        case 'hide':
                            this.hide = true;
                            this.indeterminate = false;
                            break;

                        case 'indeterminate':
                            this.hide = false;
                            this.indeterminate = true;
                            break;

                        default:
                            this.hide = false;
                            this.indeterminate = false;
                            this.progress = value;
                            break;
                    }
                }, 0);
            }));
    }

    ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }
}
