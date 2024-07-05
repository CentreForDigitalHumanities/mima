import { Injectable } from '@angular/core';

export class Cache<T> {
    private items: { [key: string]: Promise<T> } = {};

    async get(key: string, set: () => Promise<T>): Promise<T> {
        if (this.items[key] === undefined) {
            this.items[key] = set();
        }

        return await this.items[key];
    }
}

@Injectable({
    providedIn: 'root'
})
export class CacheService {
    private items: { [area: string]: Cache<any> } = {};

    /**
     * Initializes a cache collection
     * @param area unique name identifying the items
     * @returns cache accessor
     */
    init<T>(area: string) {
        if (!this.items[area]) {
            this.items[area] = new Cache<T>();
        }

        return <Cache<T>>this.items[area];
    }

    key(object: any): string {
        return JSON.stringify(object);
    }
}
