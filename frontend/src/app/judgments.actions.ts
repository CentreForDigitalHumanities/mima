import { createAction, props } from '@ngrx/store';
import { Judgment, MatchedJudgment } from './models/judgment';
import { Filter, FilterField, FilterOperator } from './models/filter';
import { LikertShow } from './likert/likert.component';

/**
 * Load the judgments from the json in assets
 */
export const loadJudgments = createAction('[Judgments] Load Judgments from Server');

/**
 * Set the judgments
 */
export const setJudgments = createAction('[Judgments] Set Judgments', props<{
    judgments: ReadonlyMap<string, Judgment>,
    applyFilters: boolean
}>());

/**
 * Set all the judgments which have been found to match the current filters
 */
export const setMatchedJudgments = createAction('[Judgments] Set Matched judgments', props<{
    matchedJudgments: Iterable<MatchedJudgment>
}>());

/**
 * Filter the judgments based on the current filters
 */
export const filterJudgments = createAction('[Judgments] Filter Judgments');
/**
 * Clear the filters and reset the judgments
 */
export const clearFilters = createAction('[Judgments] Clear Filters');

/**
 * Add new filter
 */
export const addFilter = createAction('[Judgments] Add Filter');

/**
 * Adds or updates a filter to search for the field matching a specific content
 */
export const setIncludingFilter = createAction('[Judgments] Add Singular Filter', props<{
    field: FilterField<'judgment'>,
    /**
     * The first item should be the parent content, for example when filtering on dialects
     * the first item is the one which the user clicked on. The following items
     * are the subdialects. The main item is determined whether it should be interpreted
     * as toggle (adding it versus toggling)
     */
    content: string[]
}>());

/**
 * Adds or updates a filter to search for a field NOT matching a specific content
 */
export const setExcludingFilter = createAction('[Judgments] Add Excluding Filter', props<{
    field: FilterField<'judgment'>,
    /**
     * This is the content which should NOT be shown
     */
    exclude: string[],
    /**
     * This is the content which should be shown
     */
    include: string[]
}>());

/**
 * Replaces all filters
 */
export const setFilters = createAction('[Judgments] Set Filters', props<{
    filters: ReadonlyArray<Filter<'judgment'>>
}>());

export const setFiltersOperator = createAction('[Judgments] Set Filters Operator', props<{
    operator: FilterOperator
}>());

/**
 * Update specific filter
 */
export const updateFilter = createAction('[Judgments] Update Filter', props<{
    filter: Readonly<Filter<'judgment'>>
}>());

/**
 * Remove specific filter
 */
export const removeFilter = createAction('[Judgments] Remove Filter', props<{
    filterIndex: number
}>());

/**
 * Change the display of numbers
 */
export const toggleShow = createAction('[Judgments] Set Show', props<{
    show?: LikertShow
}>());
