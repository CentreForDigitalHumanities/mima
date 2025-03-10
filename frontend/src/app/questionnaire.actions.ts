import { createAction, props } from '@ngrx/store';
import { MatchedQuestion, Question } from './models/question';
import { Filter, FilterField, FilterOperator } from './models/filter';

/**
 * Load the questionnaire from the json in assets
 */
export const loadQuestionnaire = createAction('[Questionnaire] Load Questionnaire from Server');

/**
 * sets the questionnaire
 */
export const setQuestions = createAction('[Questionnaire] Set Questions', props<{
    questions: Map<string, Question>,
    applyFilters: boolean
}>());

/**
 * Set all the questions which have been found to match the current filters
 */
export const setMatchedQuestions = createAction('[Questionnaire] Set Matched questions', props<{
    matchedQuestions: Iterable<MatchedQuestion>
}>());


/**
 * Clear all the set filters (if any)
 */
export const clearFilters = createAction('[Questionnaire] Clear Filters');

/**
 * Add new filter
 */
export const addFilter = createAction('[Questionnaire] Add Filter');

/**
 * Adds or updates a filter to search for the field matching a specific content
 */
export const setIncludingFilter = createAction('[Questionnaire] Add Singular Filter', props<{
    field: FilterField<'question'>,
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
export const setExcludingFilter = createAction('[Questionnaire] Add Excluding Filter', props<{
    field: FilterField<'question'>,
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
export const setFilters = createAction('[Questionnaire] Set Filters', props<{
    filters: ReadonlyArray<Filter<'question'>>
}>());

export const setFiltersOperator = createAction('[Questionnaire] Set Filters Operator', props<{
    operator: FilterOperator
}>());

/**
 * Update specific filter
 */
export const updateFilter = createAction('[Questionnaire] Update Filter', props<{
    filter: Readonly<Filter<'question'>>
}>());

/**
 * Remove specific filter
 */
export const removeFilter = createAction('[Questionnaire] Remove Filter', props<{
    filterIndex: number
}>());
