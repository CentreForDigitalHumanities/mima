import { Injectable } from '@angular/core';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { mergeMap } from 'rxjs/operators';
import { State } from './questionnaire.state';


import { QuestionnaireService } from './services/questionnaire.service';
import { loadQuestionnaire, setQuestions } from './questionnaire.actions';
import { Question } from './models/question';


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
                question.answerMap = this.questionnaireService.convertToAnswersByDialect([question]);
                questions.set(question.id, question);
            }
            return setQuestions({
                questions,
                applyFilters: true
            });
        })
    ));
}
