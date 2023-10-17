import { createAction, props } from '@ngrx/store';
import { Question } from './models/question';

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
    matchedquestions: Array<Question>
}>());
