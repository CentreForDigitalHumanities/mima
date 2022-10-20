import { Injectable } from '@angular/core';
import { Adverbial } from '../models/adverbial';
import { Filter } from '../models/filter';
import { FilterService } from './filter.service';

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

    async filter(filters: Filter[]): Promise<Iterable<Adverbial>> {
        const matched = this.database.filter(
            adverbial => {
                if (filters.length === 0) {
                    // no filters? match everything!
                    return true;
                }

                // OR logic: any should match
                for (const filter of filters) {
                    if (this.filterService.filterMatch(adverbial, filter)) {
                        return true;
                    }
                }

                return false;
            });

        return Promise.resolve(matched);
    }
}
