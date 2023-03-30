import { createAction, props } from '@ngrx/store';
import { Adverbial, MatchedAdverbial } from './models/adverbial';
import { Filter, FilterOperator } from './models/filter';

/**
 * Clear all the set filters (if any)
 */
export const clearFilters = createAction('[Adverbials] Clear Filters');

/**
 * Add new filter
 */
export const addFilter = createAction('[Adverbials] Add Filter');


/**
 * Replaces all filters
 */
export const setFilters = createAction('[Adverbials] Set Filters', props<{
    filters: ReadonlyArray<Filter>
}>());

export const setFiltersOperator = createAction('[Adverbials] Set Filters Operator', props<{
    operator: FilterOperator
}>());

/**
 * Update specific filter
 */
export const updateFilter = createAction('[Adverbials] Update Filter', props<{
    filter: Readonly<Filter>
}>());

/**
 * Remove specific filter
 */
export const removeFilter = createAction('[Adverbials] Remove Filter', props<{
    filterIndex: number
}>());

/**
 * Request loading adverbials from the server
 */
export const loadAdverbials = createAction('[Adverbials] Load Adverbials from Server');

/**
 * Set adverbials which have been loaded from the server (or previewed)
 */
export const setAdverbials = createAction('[Adverbials] Set Adverbials', props<{
    adverbials: ReadonlyArray<Adverbial>,
    applyFilters: boolean
}>());

/**
 * Set all the adverbials which have been found to match the current filters
 */
export const setMatchedAdverbials = createAction('[Adverbials] Set Matched Adverbials', props<{
    matchedAdverbials: ReadonlyArray<MatchedAdverbial>
}>());
