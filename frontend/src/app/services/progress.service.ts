import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { transitionValue } from '../transition-numbers.pipe';

export type ProgressValue = number | 'indeterminate' | 'hide';

const animationTime = 200; // ms

@Injectable({
    providedIn: 'root'
})
export class ProgressService implements OnDestroy {
    private value = new BehaviorSubject<ProgressValue>('hide');
    private transitionSubscription: Subscription = undefined;

    value$ = this.value.asObservable();

    start() {
        this.value.next(0);
    }

    next(count: number, total: number, endWith: ProgressValue = 1) {
        let percentage: number;
        if (total <= 0) {
            percentage = 0;
        } else {
            percentage = Math.ceil((count / total) * 100);
        }
        if (percentage !== this.value.value) {
            this.transitionSubscription?.unsubscribe();
            let startValue: number;

            switch (this.value.value) {
                case 'hide':
                case 'indeterminate':
                    startValue = 0;
                    break;

                default:
                    startValue = this.value.value;
                    break;
            }

            this.transitionSubscription = transitionValue(startValue, percentage, animationTime, endWith).subscribe(
                value => {
                    this.value.next(value);
                }
            );
        }
    }

    complete() {
        this.next(1, 1, 'hide');
    }

    indeterminate() {
        this.transitionSubscription?.unsubscribe();
        this.value.next('indeterminate');
    }

    ngOnDestroy(): void {
        this.transitionSubscription?.unsubscribe();
    }
}
