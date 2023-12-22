import { Injectable } from '@angular/core';
import { ParamMap } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, combineLatestWith, map, skip } from 'rxjs';
import { State } from '../questionnaire.state';
import { Filter, FilterField, FilterOperator } from '../models/filter';

const fullMatchPrefix = '_';
const operatorField = 'OP';

@Injectable({
    providedIn: 'root'
})
export class FilterManagementService {
    queryParams$: Observable<any>;

    constructor(private store: Store<State>) {
        this.queryParams$ = this.store.select('questionnaire', 'filters').pipe(
            skip(1), // skip emitting the initial filters
            combineLatestWith(this.store.select('questionnaire', 'operator')),
            map(([filters, operator]) => this.toQueryParams(operator, filters)));
    }

    toQueryParams(operator: FilterOperator, filters: readonly Filter[]): any {
        let queryParams: { [fieldName: string]: string[] } = {};

        if (!filters) {
            return queryParams;
        }

        let empty = true;
        for (const filter of filters) {
            const fieldName = `${filter.onlyFullMatch ? fullMatchPrefix : ''}${filter.field}`;

            if (empty && filter.content.find(c => !!c?.trim())) {
                empty = false;
            }

            let suffix = '';
            let i = 0;
            while ((fieldName + suffix) in queryParams) {
                suffix = `${i}`;
            }

            queryParams[fieldName + suffix] = filter.content;
        }

        if (filters.length > 1) {
            queryParams[operatorField] = [operator];
        }

        if (empty) {
            return {};
        }

        return queryParams;
    }

    fromQueryParams(queryParams: ParamMap): [FilterOperator, Filter[]] {
        let operator: FilterOperator = 'and';
        let filters: Filter[] = [];
        for (let key of queryParams.keys) {
            if (key === operatorField) {
                operator = <FilterOperator>queryParams.get(key);
            } else {
                let onlyFullMatch = false;
                if (key.startsWith(fullMatchPrefix)) {
                    onlyFullMatch = true;
                }

                let content = queryParams.getAll(key);
                filters.push({
                    content,
                    field: <FilterField>key.substring(onlyFullMatch ? 1 : 0).replace(/\d+$/, ''),
                    index: filters.length,
                    onlyFullMatch
                });
            }
        }

        return [operator, filters];
    }
}
