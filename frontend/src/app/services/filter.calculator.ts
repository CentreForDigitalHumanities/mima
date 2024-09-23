import { Filter, FilterMatchedObject, FilterObject, FilterObjectName, FilterOperator } from '../models/filter';
import { FilterService, isJudgment, isQuestion } from './filter.service';

/**
 * How many matches can be returned in a single batch?
 */
const batchSize = 10;
const intervalMs = 1;

type CalculationStep = 'start' | 'visible' | 'matches' | 'remainder' | 'done';
const calculationSteps: CalculationStep[] = ['start', 'visible', 'matches', 'remainder', 'done'];

type Result<T extends FilterObjectName> = {
    match: true;
    stale: boolean;
    value: FilterMatchedObject<T>,
    input: FilterObject<T>
} | {
    match: false;
    stale: boolean;
    input: FilterObject<T>
};

/**
 * Calculates the results for a set of question and filters.
 */
export class Calculator<T extends FilterObjectName> {
    private interval: ReturnType<typeof setInterval> | null = null;

    /***
     * Which results should be calculated next
     */
    private step: CalculationStep = 'start';
    private batchData: FilterObject<T>[] = [];
    private idIndex!: { [id: string]: number };

    private results: Result<T>[];

    /**
     *
     * @param filterService
     * @param objects
     * @param filters
     * @param operator
     * @param visibleIds
     * @param emit handler for results
     * @param done handler for when calculation is done
     */
    constructor(
        private filterService: FilterService,
        private objects: FilterObject<T>[],
        private filters: Filter<T>[] | ReadonlyArray<Filter<T>>,
        private operator: FilterOperator,
        private visibleIds: Set<string>,
        private emit: (matched: FilterMatchedObject<T>[], unmatched: string[]) => void,
        private done: () => void) {
        this.idIndex = {};
        for (let i = 0; i < objects.length; i++) {
            this.idIndex[this.objectId(objects[i])] = i;
        }
        this.results = this.objects.map(q => ({
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
            const matched: FilterMatchedObject<T>[] = [];
            const unmatched: string[] = [];

            for (const result of this.results) {
                if (result.match) {
                    matched.push(result.value)
                } else {
                    unmatched.push(this.objectId(result.input));
                }
            }
            this.emit(matched, unmatched);
            return;
        }

        if (!this.interval) {
            this.interval = setInterval(() => this.iterate(), intervalMs);
        }

        // start from the beginning: update the visible objects first
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

    private objectId(item: FilterObject<T>): string {
        if (isQuestion(item)) {
            return item.id;
        } else if (isJudgment(item)) {
            return item.judgmentId;
        }

        throw "Not Implemented"
    }

    /**
     * Objects which matched the previous query
     */
    private *matches(): Iterable<FilterObject<T>> {
        for (const item of this.results) {
            if (item.match && item.stale) {
                yield item.input;
            }
        }
    }

    /**
     * all the objects which are still stale
     */
    private *stale(): Iterable<FilterObject<T>> {
        for (const item of this.results) {
            if (item.stale) {
                yield item.input;
            }
        }
    }

    private *visibleObjects(): Iterable<FilterObject<T>> {
        for (const id of this.visibleIds) {
            const object = this.objects[this.idIndex[id]];
            if (object) {
                // can be missing when switching views
                yield object;
            }
        }
    }

    private iterate() {
        let objects: Iterable<FilterObject<T>>;
        let iterationSize = batchSize;

        while (this.batchData.length === 0 && this.step !== 'done') {
            // move to the next step
            this.step = calculationSteps[calculationSteps.indexOf(this.step) + 1];
            switch (this.step) {
                case 'visible':
                    objects = this.visibleObjects();
                    // always calculate all visible objects, because the associated notification
                    // assumes this data is complete
                    iterationSize = this.visibleIds.size;
                    break;

                case 'matches':
                    objects = this.matches();
                    break;

                case 'remainder':
                    objects = this.stale();
                    break;

                case 'done':
                    objects = [];
                    break;
            }

            this.batchData = [...objects];
        }

        if (this.step === 'done') {
            clearInterval(this.interval);
            this.interval = null;
            this.done();
        }

        const matched: FilterMatchedObject<T>[] = [];
        const unmatched: string[] = [];

        let i = 0;
        while (this.batchData.length && i < iterationSize) {
            const object = this.batchData.shift();
            const objectId = this.objectId(object);
            const match = this.filterService.applyFilters(object, this.filters, this.operator);
            if (match === undefined) {
                this.results[this.idIndex[objectId]] = { match: false, stale: false, input: object };
                unmatched.push(objectId);
            } else {
                this.results[this.idIndex[objectId]] = { match: true, stale: false, input: object, value: match };
                matched.push(match);
                i++;
            }
        }

        this.emit(matched, unmatched);
    }
}
