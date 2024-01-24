import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ProgressValue = number | 'indeterminate' | 'hide';

@Injectable({
    providedIn: 'root'
})
export class ProgressService {
    private value = new BehaviorSubject<ProgressValue>('hide');

    value$ = this.value.asObservable();

    start() {
        this.value.next(0);
    }

    next(count: number, total: number) {
        let percentage: number;
        if (total <= 0) {
            percentage = 0;
        } else {
            percentage = Math.ceil((count / total) * 100);
        }
        if (percentage !== this.value.value) {
            this.value.next(percentage);
        }
    }

    complete() {
        this.value.next('hide');
    }

    indeterminate() {
        this.value.next('indeterminate');
    }
}
