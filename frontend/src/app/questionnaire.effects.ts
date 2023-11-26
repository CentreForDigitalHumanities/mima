import { Injectable } from '@angular/core';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { mergeMap } from 'rxjs/operators';
import { State } from './questionnaire.state';


import { QuestionnaireService } from './services/questionnaire.service';
import { loadQuestionnaire, setQuestions, addFilter, removeFilter, clearFilters, setFilters, updateFilter, setFiltersOperator, setMatchedQuestions, setSingularFilter, setExcludingFilter } from './questionnaire.actions';
import { MatchedQuestion, Question } from './models/question';
import { MatchedAdverbial } from './models/adverbial';


@Injectable()
export class QuestionnaireEffects {
    constructor(
        private actions$: Actions,
        private questionnaireService: QuestionnaireService,
        private store: Store<State>
    ) { }


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
        ofType(addFilter, removeFilter, clearFilters, setFilters, setSingularFilter, setExcludingFilter, updateFilter, setQuestions, setFiltersOperator),
        concatLatestFrom(() => [
            this.store.select('questionnaire', 'filters'),
            this.store.select('questionnaire', 'operator')
        ]),
        mergeMap(async ([action, filters, operator]) => {
            let matchedQuestions: (MatchedAdverbial| MatchedQuestion)[];
            if (action.type === '[Questionnaire] Set Questions' && !action.applyFilters) {
                // match everything
                matchedQuestions =  Array.from(action.questions.values()).map(question => new MatchedQuestion(question));
            } else {
                matchedQuestions = Array.from(await this.questionnaireService.filter(filters, operator));
            }

            return setMatchedQuestions({
                matchedQuestions
            });
        })
    ));
}
