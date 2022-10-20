import { Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { debounceTime, switchMap } from 'rxjs/operators';

import { Adverbial } from '../models/adverbial';
import { Filter } from '../models/filter';
import { AdverbialsService } from '../services/adverbials.service';

@Component({
    selector: 'mima-adverbial-list-page',
    templateUrl: './adverbial-list-page.component.html',
    styleUrls: ['./adverbial-list-page.component.scss']
})
export class AdverbialListPageComponent implements OnInit, OnDestroy {
    adverbials = new BehaviorSubject<Adverbial[]>([]);
    filters = new BehaviorSubject<Filter[]>([]);
    filtersDebounced = this.filters.asObservable().pipe(
        debounceTime(200));
    subscriptions: Subscription[];

    constructor(private adverbialService: AdverbialsService) {
    }

    async ngOnInit(): Promise<void> {
        this.adverbials.next(Array.from(await this.adverbialService.get()));
        this.subscriptions = [
            this.filtersDebounced.pipe(
                switchMap(async (filters) => {
                    return await this.adverbialService.filter(filters);
                })
            ).subscribe(adverbials => {
                this.adverbials.next(Array.from(adverbials));
            })
        ];
    }

    ngOnDestroy(): void {
        for (const subscription of this.subscriptions) {
            subscription.unsubscribe();
        }
    }

    async applyFilters(filters: Iterable<Filter>): Promise<void> {
        this.filters.next([...filters]);
    }

}
