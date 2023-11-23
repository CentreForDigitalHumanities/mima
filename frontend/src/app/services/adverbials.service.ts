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

    async filter(filters: ReadonlyArray<Filter>, operator: FilterOperator): Promise<Iterable<MatchedAdverbial | MatchedQuestion>> {
        const matched = this.database
            .map(object_to_filter => this.filterService.applyFilters(object_to_filter, filters, operator))
            .filter(object_to_filter => !!object_to_filter);

        return Promise.resolve(matched);
    }
}
