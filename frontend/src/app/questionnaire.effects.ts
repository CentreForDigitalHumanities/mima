import { Injectable, OnDestroy } from '@angular/core';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { filter, mergeMap } from 'rxjs/operators';
import { State, initialState } from './questionnaire.state';

import { QuestionnaireService } from './services/questionnaire.service';
import { loadQuestionnaire, setQuestions, addFilter, removeFilter, clearFilters, setFilters, updateFilter, setFiltersOperator, setMatchedQuestions, setIncludingFilter, setExcludingFilter } from './questionnaire.actions';
import { Filter, FilterOperator } from './models/filter';
import { MatchedQuestion, Question } from './models/question';
import { FilterService } from './services/filter.service';


@Injectable()
export class QuestionnaireEffects implements OnDestroy {

    constructor(
        private actions$: Actions,
        private filterService: FilterService,
        private questionnaireService: QuestionnaireService,
        private store: Store<State>
    ) {
        this.subscriptions = [
            this.questionnaireService.results$.subscribe(matchedQuestions => {
                store.dispatch(setMatchedQuestions({
                    matchedQuestions
                }))
            })
        ];
    }

    private subscriptions!: Subscription[];
    private currentFilters: readonly Filter[] = [];
    private currentFilterOperator: FilterOperator = initialState.questionnaire.operator;

    loadQuestionnaire$ = createEffect(() => this.actions$.pipe(
        ofType(loadQuestionnaire),
        mergeMap(async () => {
            const questionArray = Array.from(await this.questionnaireService.get());
            const questions = new Map<string, Question>();
            for (let question of questionArray) {
                questions.set(question.id, question);
            }
            return setQuestions({
                questions,
                applyFilters: true
            });
        })
    ));

    filterQuestions$ = createEffect(() => this.actions$.pipe(
        ofType(addFilter, removeFilter, clearFilters, setFilters, setIncludingFilter, setExcludingFilter, updateFilter, setQuestions, setFiltersOperator),
        concatLatestFrom(() => [
            this.store.select('questionnaire', 'filters'),
            this.store.select('questionnaire', 'operator')
        ]),
        mergeMap(async ([action, filters, operator]) => {
            let matchedQuestions: MatchedQuestion[];
            if (action.type === '[Questionnaire] Set Questions' && !action.applyFilters) {
                // match everything
                matchedQuestions = Array.from(action.questions.values()).map(question => new MatchedQuestion(question));
                this.currentFilterOperator = operator;

                return setMatchedQuestions({
                    matchedQuestions
                });
            } else {
                if (action.type !== '[Questionnaire] Set Questions' && this.currentFilterOperator == operator && !this.filterService.differ(this.currentFilters, filters)) {
                    // equivalent filters, don´t update results
                    return null;
                }

                this.questionnaireService.filter(filters, operator);
                this.currentFilters = filters;
                this.currentFilterOperator = operator;

                return null;
            }
        }),
        filter(action => action !== null)
    ));

    ngOnDestroy(): void {
        this.subscriptions.forEach(s => s.unsubscribe());
    }
}
