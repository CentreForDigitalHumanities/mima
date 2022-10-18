import { Injectable } from '@angular/core';
import { Adverbial } from '../models/adverbial';

@Injectable({
    providedIn: 'root'
})
export class AdverbialsService {
    // TODO: replace temporary in-memory database with actual database
    private database: Adverbial[] = [];

    constructor() { }

    async save(items: Iterable<Adverbial>): Promise<{ success: boolean }> {
        this.database.push(...items);
        return Promise.resolve({ success: true });
    }

    async get(): Promise<Iterable<Adverbial>> {
        return Promise.resolve(this.database);
    }
}
