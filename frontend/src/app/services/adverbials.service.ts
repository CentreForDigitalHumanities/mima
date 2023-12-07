import { Injectable } from '@angular/core';
import { Adverbial, MatchedAdverbial } from '../models/adverbial';
import { Filter, FilterOperator } from '../models/filter';
import { FilterService } from './filter.service';
import { MatchedQuestion } from '../models/question';

@Injectable({
    providedIn: 'root'
})
export class AdverbialsService {
    // TODO: replace temporary in-memory database with actual database
    private database: Adverbial[] = [];

    constructor(private filterService: FilterService) { }

    async save(items: Iterable<Adverbial>): Promise<{ success: boolean }> {
        this.database.push(...items);
        return Promise.resolve({ success: true });
    }

    async get(): Promise<Iterable<Adverbial>> {
        return Promise.resolve(this.database);
    }

    async filter(filters: ReadonlyArray<Filter>, operator: FilterOperator): Promise<Iterable<MatchedAdverbial>> {
        const matched = this.database
            .map(adverbial => this.filterService.applyFilters(adverbial, filters, operator))
            .filter(adverbial => !!adverbial);

        return Promise.resolve(matched);
    }
}
