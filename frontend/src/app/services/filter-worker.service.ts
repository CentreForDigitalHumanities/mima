import { Injectable, OnDestroy } from '@angular/core';
import { MatchedQuestion, MatchedQuestionDeserialized, Question } from '../models/question';
import { Filter, FilterOperator } from '../models/filter';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { distinct, map, throttleTime } from 'rxjs/operators';
import { CacheService } from './cache.service';
import { FilterService, isEmptyFilter } from './filter.service';
import { ProgressService } from './progress.service';
import { WorkerReceiver } from './filter.worker-receiver';
import { environment } from 'src/environments/environment';
import { Judgement, MatchedJudgement } from '../models/judgement';


export type FilterWorkerMessage = {
    command: 'startCalc',
    value: {
        questions: Question[],
        judgements: Judgement[],
        filters: ReadonlyArray<Filter>,
        operator: FilterOperator,
        visibleIds: string[]
    }
} | {
    command: 'setVisible',
    value: {
        ids: string[]
    }
} | {
    command: 'results',
    value: {
        matched: MatchedQuestionDeserialized[],
        unmatched: string[]
    }
} | {
    command: 'done' | 'pause' | 'resume'
};

class Result {
    match: boolean;
    value: MatchedQuestion | MatchedJudgement;
}

class FakeWorker {
    private subscription!: Subscription;
    constructor(private workerReceiver: WorkerReceiver) {
        this.subscription = workerReceiver.message$.subscribe(msg => {
            this.onmessage({
                data: msg
            });
        });
    }

    onmessage: ((this: FakeWorker, ev: { data: any }) => any) | null;

    terminate() {
        this.subscription?.unsubscribe();
        this.subscription = undefined;
    }

    postMessage(message: any) {
        this.workerReceiver.handleMessage({
            command: message.command,
            value: message.value ? JSON.parse(message.value) : undefined
        });
    }
}


/**
 * Wraps the communication with a web worker doing the calculations
 * or if web workers aren't available, do the calculations directly.
 */
class CalculatorWorker {
    private worker!: Worker | FakeWorker;
    private results!: BehaviorSubject<{ [id: string]: Result }>;
    private complete = new BehaviorSubject(false);

    /**
     * List of matches
     */
    results$!: Observable<readonly (MatchedQuestion|MatchedJudgement)[]>;

    /**
     * Whether the calculations are done
     */
    complete$ = this.complete.asObservable();

    /**
     * Whether it's currently calculating
     */
    active = true;

    constructor(filterService: FilterService,
        filters: readonly Filter[],
        operator: FilterOperator,
        questions: Question[] = [],
        judgements: Judgement[] = [],
        visibleIds: string[],
        previous?: CalculatorWorker) {
        this.results = new BehaviorSubject<{ [id: string]: Result }>(
            previous ? { ...previous.results.value } : {});
        this.results$ = this.results.pipe(
            map((result) => Object.values(result).filter(r => r.match).map(r => r.value)));

        if (environment.workers && typeof Worker !== 'undefined') {
            // Create a new web worker
            this.worker = new Worker(new URL('./filter.worker', import.meta.url));
            this.worker.onmessage = (event: { data: any }) => {
                const data: FilterWorkerMessage = {
                    command: event.data.command,
                    value: event.data.value ? JSON.parse(event.data.value) : undefined
                };

                this.handleMessage(data);
            };
        } else {
            // Fallback for when web workers aren't supported (emulate in a single-threaded mode)
            this.worker = new FakeWorker(new WorkerReceiver(filterService));
            this.worker.onmessage = (event: { data: FilterWorkerMessage }) => {
                this.handleMessage(event.data);
            };
        }

        this.postMessage({
            command: 'startCalc',
            value: {
                filters,
                operator,
                questions,
                judgements,
                visibleIds
            }
        });
    }

    terminate() {
        this.results.unsubscribe();
        this.worker.terminate();
        this.active = false;
    }

    setVisible(ids: string[]) {
        this.postMessage({
            command: 'setVisible',
            value: { ids }
        });
    }

    pause() {
        this.active = false;
        if (!this.complete.value) {
            this.postMessage({
                command: 'pause'
            });
        }
    }

    resume() {
        if (!this.complete.value && !this.active) {
            this.active = true;
            this.postMessage({
                command: 'resume'
            });
        }
    }

    /**
     * Emits the current results; e.g. when switching to this calculator when
     * it's already done.
     */
    emitResults() {
        this.results.next(this.results.value);
        this.complete.next(this.complete.value);
    }

    private handleMessage(data: FilterWorkerMessage) {
        switch (data.command) {
            case 'results':
                {
                    const updated = this.results.value;

                    for (const id of data.value.unmatched) {
                        delete updated[id];
                    }

                    for (const match of data.value.matched) {
                        const restored = MatchedQuestion.restore(match);
                        updated[restored.id.text] = {
                            match: true,
                            value: restored
                        }
                    }

                    this.results.next(updated);
                }
                break;

            case 'done':
                this.worker.terminate();
                this.complete.next(true);
                this.active = false;
                break;

            default:
                console.error(`Unknown command received: ${data.command}`);
                console.log(data);
                break;
        }
    }

    private postMessage(data: FilterWorkerMessage) {
        this.worker.postMessage({
            command: data.command,
            value: 'value' in data ? JSON.stringify(data.value) : undefined
        });
    }
}

@Injectable({
    providedIn: 'root'
})
export class FilterWorkerService implements OnDestroy {
    private static emptyFilterKey = 'EMPTY';

    private subscription: Subscription[] = [];
    private visibleIds = new BehaviorSubject<string[]>([]);
    private workers: { [key: string]: CalculatorWorker } = {};
    private questions: Question[];
    private judgements: Judgement[];
    private current: CalculatorWorker = undefined;
    private currentKey: string = undefined;

    /**
     * Subscriptions on the current worker
     */
    private workerSubscriptions: Subscription[] = [];

    private results = new BehaviorSubject<readonly (MatchedQuestion|MatchedJudgement)[]>([]);

    /**
     * List of matches
     */
    results$ = this.results.asObservable();

    constructor(private cacheService: CacheService, private filterService: FilterService, private progressService: ProgressService) {
        this.subscription = [
            // throttle the visible IDs to prevent the worker from dealing with many signals
            this.visibleIds.pipe(
                throttleTime(10, undefined, { leading: true, trailing: true }),
                distinct(ids => ids.join('-'))).subscribe(ids => {
                    this.current?.setVisible(ids);
                })];

    }

    ngOnDestroy(): void {
        this.subscription.forEach(s => s.unsubscribe());
    }
    private createWorker(key: string, filters: readonly Filter[], operator: FilterOperator) {
        this.workers[key] = new CalculatorWorker(
            this.filterService,
            filters,
            operator,
            this.questions,
            this.judgements,
            this.visibleIds.value,
            this.current);
        this.activateWorker(key);
    }

    private activateWorker(key: string) {
        if (key === this.currentKey) {
            // already active!
            return;
        }

        // pause the current worker
        this.current?.pause();

        this.workerSubscriptions.forEach(s => s.unsubscribe());
        this.current = this.workers[key];
        this.currentKey = key;
        this.current.resume();
        this.progressService.indeterminate();

        this.workerSubscriptions = [
            this.current.results$.subscribe(results => {
                console.log('results', results)
                this.results.next(results);
            }),
            this.current.complete$.subscribe(done => {
                if (done) {
                    this.progressService.complete();
                }
            })
        ];
        this.current.emitResults();
    }

    // pass questions
    setData(questions: (Question | Judgement)[]) {
        this.workerSubscriptions.forEach(s => s.unsubscribe());
        Object.values(this.workers).forEach(worker => worker.terminate());
        this.workers = {};

        if (questions.length > 0 && this.isQuestion(questions[0])) {
            this.questions = questions as Question[];
            this.current = undefined;
            this.currentKey = undefined;
            this.createWorker(FilterWorkerService.emptyFilterKey, [], 'and');
        } else if (questions.length > 0 && this.isJudgement(questions[0])) {
            this.judgements = questions as Judgement[];
            // Perform the desired action for Judgement objects
        } else {
            // Handle the case when the input is neither Question nor Judgement objects
        }
    }

    // set filters
    setFilters(filters: readonly Filter[], operator: FilterOperator) {
        const key = filters.length > 0 && filters.find(filter => !isEmptyFilter(filter))
            ? this.cacheService.key({ filters, operator })
            : FilterWorkerService.emptyFilterKey;

        const worker = this.workers[key];

        if (worker) {
            this.activateWorker(key);
        } else {
            this.createWorker(key, filters, operator);
        }
    }

    // set visible questions
    setVisible(ids: Set<string>) {
        this.visibleIds.next(Array.from(ids.values()));
    }

    isQuestion(obj: any): obj is Question {
        return 'question' in obj && 'answers' in obj;
    }

    isJudgement(obj: any): obj is Judgement {
        return 'judgementId' in obj && 'responses' in obj;
    }

}
