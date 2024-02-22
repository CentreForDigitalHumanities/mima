import { Injectable } from '@angular/core';

export class Cache<T> {
    private items: { [key: string]: T } = {};

    get(key: string): T | undefined {
        return this.items[key] || undefined;
    }

    set(key: string, value: T): void {
        this.items[key] = value;
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
