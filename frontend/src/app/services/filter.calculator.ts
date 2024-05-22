import { MatchedQuestion, Question } from '../models/question';
import { Filter, FilterOperator } from '../models/filter';
import { FilterService } from './filter.service';

/**
 * How many matches can be returned in a single batch?
 */
const batchSize = 10;
const intervalMs = 1;

type CalculationStep = 'start' | 'visible' | 'matches' | 'remainder' | 'done';
const calculationSteps: CalculationStep[] = ['start', 'visible', 'matches', 'remainder', 'done'];

type Result = {
    match: true;
    stale: boolean;
    value: MatchedQuestion,
    input: Question
} | {
    match: false;
    stale: boolean;
    input: Question
};

/**
 * Calculates the results for a set of question and filters.
 */
export class Calculator {
    private interval: ReturnType<typeof setInterval> | null = null;

    /***
     * Which results should be calculated next
     */
    private step: CalculationStep = 'start';
    private batchData: Question[] = [];
    private idIndex!: { [id: string]: number };

    private results: Result[];

    /**
     *
     * @param filterService
     * @param questions
     * @param filters
     * @param operator
     * @param visibleIds
     * @param emit handler for results
     * @param done handler for when calculation is done
     */
    constructor(
        private filterService: FilterService,
        private questions: Question[],
        private filters: Filter[] | ReadonlyArray<Filter>,
        private operator: FilterOperator,
        private visibleIds: Set<string>,
        private emit: (matched: MatchedQuestion[], unmatched: string[]) => void,
        private done: () => void) {
        this.idIndex = {};
        for (let i = 0; i < questions.length; i++) {
            this.idIndex[questions[i].id] = i;
        }
        this.results = this.questions.map(q => ({
            input: q,
            match: false,
            stale: true
        }));
    }

    /**
     * Starts or resume calculations
     */
    start() {
        if (this.step === 'done') {
            // update the view, only return the results
            const matched: MatchedQuestion[] = [];
            const unmatched: string[] = [];

            for (const result of this.results) {
                if (result.match) {
                    matched.push(result.value)
                } else {
                    unmatched.push(result.input.id);
                }
            }
            this.emit(matched, unmatched);
            return;
        }

        if (!this.interval) {
            this.interval = setInterval(() => this.iterate(), intervalMs);
        }

        // start from the beginning: update the visible questions first
        this.step = 'start';
        this.batchData = [];
    }

    pause() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    setVisibleIds(ids: string[]) {
        this.visibleIds = new Set(ids);
    }

    /**
     * Questions which matched the previous query
     */
    private *matches(): Iterable<Question> {
        for (const item of this.results) {
            if (item.match && item.stale) {
                yield item.input;
            }
        }
    }

    /**
     * all the questions which are still stale
     */
    private *stale(): Iterable<Question> {
        for (const item of this.results) {
            if (item.stale) {
                yield item.input;
            }
        }
    }

    private *visibleQuestions(): Iterable<Question> {
        for (const id of this.visibleIds) {
            yield this.questions[this.idIndex[id]];
        }
    }

    private iterate() {
        let questions: Iterable<Question>;
        let iterationSize = batchSize;

        while (this.batchData.length === 0 && this.step !== 'done') {
            // move to the next step
            this.step = calculationSteps[calculationSteps.indexOf(this.step) + 1];
            switch (this.step) {
                case 'visible':
                    questions = this.visibleQuestions();
                    // always calculate all visible questions, because the associated notification
                    // assumes this data is complete
                    iterationSize = this.visibleIds.size;
                    break;

                case 'matches':
                    questions = this.matches();
                    break;

                case 'remainder':
                    questions = this.stale();
                    break;

                case 'done':
                    questions = [];
                    break;
            }

            this.batchData = [...questions];
        }

        if (this.step === 'done') {
            clearInterval(this.interval);
            this.interval = null;
            this.done();
        }

        const matched: MatchedQuestion[] = [];
        const unmatched: string[] = [];

        let i = 0;
        while (this.batchData.length && i < iterationSize) {
            const question = this.batchData.shift();
            const match = this.filterService.applyFilters(question, this.filters, this.operator);
            if (match === undefined) {
                this.results[this.idIndex[question.id]] = { match: false, stale: false, input: question };
                unmatched.push(question.id);
            } else {
                this.results[this.idIndex[question.id]] = { match: true, stale: false, input: question, value: match };
                matched.push(match);
                i++;
            }
        }

        this.emit(matched, unmatched);
    }
}
