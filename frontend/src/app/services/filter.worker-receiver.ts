import { Subject } from "rxjs";
import { Calculator } from "./filter.calculator";
import { FilterWorkerMessage } from "./filter-worker.service";
import { FilterService } from "./filter.service";
import { MatchedQuestion, Question } from "../models/question";
import { Filter, FilterField, FilterMatchedObject, FilterObject, FilterObjectName, FilterOperator } from "../models/filter";
import { Judgment } from "../models/judgment";

/**
 * The receiving part of the web worker handling communications with the host
 */
export class WorkerReceiver<T extends FilterObjectName> {
    private calculator: Calculator<T>;
    private message = new Subject<FilterWorkerMessage<T>>();
    message$ = this.message.asObservable();

    constructor(private filterService: FilterService) {
    }

    handleMessage(message: FilterWorkerMessage<T>) {
        switch (message.command) {
            case 'setVisible':
                this.setVisible(message.value.ids);
                break;

            case 'startCalc':
                this.startCalc(message.value);
                break;

            case 'pause':
                this.calculator.pause();
                break;

            case 'resume':
                this.calculator.start();
                break;
        }
    }

    private startCalc(value: {
        items: FilterObject<T>[],
        filters: readonly Filter<T>[],
        operator: FilterOperator,
        visibleIds: string[]
    }) {
        this.calculator = new Calculator<any>(
            this.filterService,
            value.items,
            value.filters,
            value.operator,
            new Set(value.visibleIds),
            (matched, unmatched) => this.emit(<any>matched, unmatched),
            () => this.postMessage({ command: 'done' }));
        this.calculator.start();
    }

    private setVisible(ids: string[]): void {
        this.calculator.setVisibleIds(ids);
    }

    private emit(matched: FilterMatchedObject<T>[], unmatched: string[]): void {
        this.postMessage({
            command: 'results',
            value: {
                matched,
                unmatched
            }
        });
    }

    private postMessage(message: FilterWorkerMessage<T>) {
        this.message.next(message);
    }
}
