import { createAction, props } from '@ngrx/store';
import { Judgement, MatchedJudgement } from './models/judgement';

/**
 * Load the judgements from the json in assets
 */
export const loadJudgements = createAction('[Judgements] Load Judgements from Server');

/**
 * Set the judgements
 */
export const setJudgements = createAction('[Judgements] Set Judgements', props<{
    judgements: Map<string, Judgement>,
    applyFilters: boolean
}>());

/**
 * Set all the judgements which have been found to match the current filters
 */
export const setMatchedJudgements = createAction('[Judgements] Set Matched judgements', props<{
    matchedJudgements: Iterable<MatchedJudgement>
}>());

/**
 * Filter the judgements based on the current filters
 */
export const filterJudgements = createAction('[Judgements] Filter Judgements');
/**
 * Clear the filters and reset the judgements
 */
export const clearFilters = createAction('[Judgements] Clear Filters');
