import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { distinct, map, throttleTime } from 'rxjs/operators';
import { MatchedQuestion } from '../models/question';
import { Filter, FilterMatchedObject, FilterObject, FilterObjectName, FilterOperator } from '../models/filter';
import { CacheService } from './cache.service';
import { FilterService, isEmptyFilter, isQuestion } from './filter.service';
import { ProgressService } from './progress.service';
import { WorkerReceiver } from './filter.worker-receiver';
import { environment } from '../../environments/environment';
import { MatchedJudgment } from '../models/judgment';


export type FilterWorkerMessage<T extends FilterObjectName> = {
    command: 'startCalc',
    value: {
        items: FilterObject<T>[],
        filters: ReadonlyArray<Filter<T>>,
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
        matched: FilterMatchedObject<T>[],
        unmatched: string[]
    }
} | {
    command: 'done' | 'pause' | 'resume'
};

class Result<T extends FilterObjectName> {
    match: boolean;
    value: FilterMatchedObject<T>;
}

class FakeWorker<T extends FilterObjectName> {
    private subscription!: Subscription;
    constructor(private workerReceiver: WorkerReceiver<T>) {
        this.subscription = workerReceiver.message$.subscribe(msg => {
            this.onmessage({
                data: msg
            });
        });
    }

    onmessage: ((this: FakeWorker<T>, ev: { data: any }) => any) | null;

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
class CalculatorWorker<T extends FilterObjectName> {
    private worker!: Worker | FakeWorker<T>;
    private results!: BehaviorSubject<{ [id: string]: Result<T> }>;
    private complete = new BehaviorSubject(false);
    private active = new BehaviorSubject<boolean>(true);

    /**
     * List of matches
     */
    results$!: Observable<readonly FilterMatchedObject<T>[]>;

    /**
     * Whether the calculations are done
     */
    complete$ = this.complete.asObservable();

    /**
     * Whether it's currently calculating
     */
    active$ = this.active.asObservable();

    constructor(public objectType: T,
        filterService: FilterService,
        filters: readonly Filter<T>[],
        operator: FilterOperator,
        items: FilterObject<T>[] = [],
        visibleIds: string[],
        previous?: CalculatorWorker<T>) {
        this.results = new BehaviorSubject<{ [id: string]: Result<T> }>(
            previous ? { ...previous.results.value } : {});
        this.results$ = this.results.pipe(
            map((result) => Object.values(result).filter(r => r.match).map(r => r.value)));

        if (environment.workers && typeof Worker !== 'undefined') {
            // Create a new web worker
            this.worker = new Worker(new URL('./filter.worker', import.meta.url));
            this.worker.onmessage = (event: { data: any }) => {
                const data: FilterWorkerMessage<T> = {
                    command: event.data.command,
                    value: event.data.value ? JSON.parse(event.data.value) : undefined
                };

                this.handleMessage(data);
            };
        } else {
            // Fallback for when web workers aren't supported (emulate in a single-threaded mode)
            this.worker = new FakeWorker(new WorkerReceiver(filterService));
            this.worker.onmessage = (event: { data: FilterWorkerMessage<T> }) => {
                this.handleMessage(event.data);
            };
        }

        this.postMessage({
            command: 'startCalc',
            value: {
                filters,
                operator,
                items,
                visibleIds
            }
        });
    }

    terminate() {
        this.results.unsubscribe();
        this.worker.terminate();
        this.active.next(false);
    }

    setVisible(ids: string[]) {
        this.postMessage({
            command: 'setVisible',
            value: { ids }
        });
    }

    pause() {
        this.active.next(false);
        if (!this.complete.value) {
            this.postMessage({
                command: 'pause'
            });
        }
    }

    resume() {
        if (!this.complete.value && !this.active.value) {
            this.active.next(true);
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

    private handleMessage(data: FilterWorkerMessage<T>) {
        switch (data.command) {
            case 'results':
                {
                    const updated = this.results.value;

                    for (const id of data.value.unmatched) {
                        delete updated[id];
                    }

                    for (const match of data.value.matched) {
                        let restored: FilterMatchedObject<T>;
                        let key: string;
                        if (isQuestion(match)) {
                            const question = MatchedQuestion.restore(<any>match);
                            key = question.id.text;
                            restored = <any>question;
                        } else {
                            const judgment = MatchedJudgment.restore(match);
                            key = judgment.judgmentId.text;
                            restored = <any>judgment;
                        }
                        updated[key] = {
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
                this.active.next(false);
                break;

            default:
                console.error(`Unknown command received: ${data.command}`);
                console.log(data);
                break;
        }
    }

    private postMessage(data: FilterWorkerMessage<T>) {
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

    /**
     * Data for each filterable result set
     */
    private data: {
        [T in FilterObjectName]: {
            current: CalculatorWorker<T>,
            currentKey: string,
            items: FilterObject<T>[],
            visibleIds: BehaviorSubject<string[]>,
            workers: { [key: string]: CalculatorWorker<T> },
            results: BehaviorSubject<readonly FilterMatchedObject<T>[]>
        }
    } = {
            question: {
                current: undefined,
                currentKey: undefined,
                items: undefined,
                visibleIds: new BehaviorSubject([]),
                workers: {},
                results: new BehaviorSubject<readonly MatchedQuestion[]>([])
            },
            judgment: {
                current: undefined,
                currentKey: undefined,
                items: undefined,
                visibleIds: new BehaviorSubject([]),
                workers: {},
                results: new BehaviorSubject<readonly MatchedJudgment[]>([])
            }
        };

    /**
     * Subscriptions on the current worker
     */
    private workerSubscriptions: Subscription[] = [];

    /**
     * List of matches
     */
    results$: {
        [T in FilterObjectName]: Observable<FilterMatchedObject<T>[]>
    } = Object.assign({},
        ...Object.entries(this.data).map(([type, { results }]) => ({
            [type]: results.asObservable()
        })));

    constructor(private cacheService: CacheService, private filterService: FilterService, private progressService: ProgressService) {
        // throttle the visible IDs to prevent the worker from dealing with many signals
        this.subscription = Object.values(this.data)
            .map(data => data.visibleIds
                .pipe(
                    throttleTime(10, undefined, { leading: true, trailing: true }),
                    distinct(ids => ids.join('-'))).subscribe(ids => {
                        data.current?.setVisible(ids);
                    }));

    }

    ngOnDestroy(): void {
        this.subscription.forEach(s => s.unsubscribe());
    }

    private createWorker<T extends FilterObjectName>(objectType: T, key: string, filters: readonly Filter<T>[], operator: FilterOperator) {
        const objectData = this.data[objectType];
        objectData.workers[key] = new CalculatorWorker<T>(
            objectType,
            this.filterService,
            filters,
            operator,
            objectData.items,
            objectData.visibleIds.value,
            objectData.current);
        this.activateWorker(objectType, key);
    }

    private activateWorker<T extends FilterObjectName>(objectType: T, key: string) {
        const objectData = this.data[objectType];
        if (key === objectData.currentKey) {
            // already active!
            return;
        }

        // pause the current worker
        objectData.current?.pause();

        this.workerSubscriptions.forEach(s => s.unsubscribe());
        objectData.current = objectData.workers[key];
        objectData.currentKey = key;
        objectData.current.resume();
        const progress = this.progressService.start(true);

        this.workerSubscriptions = [
            objectData.current.results$.subscribe(items => {
                objectData.results.next(items);
            }),
            objectData.current.complete$.subscribe(done => {
                if (done) {
                    progress.complete();
                }
            }),
            objectData.current.active$.subscribe(active => {
                if (!active) {
                    // remove the progress for this one
                    progress.hide();
                }
            })
        ];
        objectData.current.emitResults();
    }

    /**
     * Pass questions or judgments
     */
    setData<T extends FilterObjectName>(objectType: T, objects: FilterObject<T>[]) {
        this.workerSubscriptions.forEach(s => s.unsubscribe());
        Object.values(this.data).forEach(data => {
            Object.values(data.workers).forEach(worker => worker.terminate());
            data.workers = {};
        });

        const objectData = this.data[objectType];

        if (objects.length > 0) {
            objectData.items = objects;
            objectData.current = undefined;
            objectData.currentKey = undefined;
            this.createWorker(objectType, FilterWorkerService.emptyFilterKey, [], 'and');
        }
    }

    /**
     * Set filters
     * @param type
     * @param filters
     * @param operator
     */
    setFilters<T extends FilterObjectName>(type: T, filters: readonly Filter<T>[], operator: FilterOperator) {
        const key = filters.length > 0 && filters.find(filter => !isEmptyFilter(filter))
            ? this.cacheService.key({ type, filters, operator })
            : FilterWorkerService.emptyFilterKey;

        const worker = this.data[type].workers[key];

        if (worker) {
            this.activateWorker(type, key);
        } else {
            this.createWorker(type, key, filters, operator);
        }
    }

    /**
     * Set visible questions or judgments
     */
    setVisible(type: FilterObjectName, ids: Set<string>) {
        this.data[type].visibleIds.next(Array.from(ids.values()));
    }
}
