import { createAction, props } from '@ngrx/store';
import { Judgment, MatchedJudgment } from './models/judgment';

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
