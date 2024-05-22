import { Subject } from "rxjs";
import { Calculator } from "./filter.calculator";
import { FilterWorkerMessage } from "./filter-worker.service";
import { FilterService } from "./filter.service";
import { MatchedQuestion, Question } from "../models/question";
import { Filter, FilterOperator } from "../models/filter";

/**
 * The receiving part of the web worker handling communications with the host
 */
export class WorkerReceiver {
    private calculator: Calculator;
    private message = new Subject<FilterWorkerMessage>();
    message$ = this.message.asObservable();

    constructor(private filterService: FilterService) {
    }

    handleMessage(message: FilterWorkerMessage) {
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
        questions: Question[],
        filters: readonly Filter[],
        operator: FilterOperator,
        visibleIds: string[]
    }) {
        this.calculator = new Calculator(
            this.filterService,
            value.questions,
            value.filters,
            value.operator,
            new Set(value.visibleIds),
            (matched, unmatched) => this.emit(matched, unmatched),
            () => this.postMessage({ command: 'done' }));
        this.calculator.start();
    }

    private setVisible(ids: string[]): void {
        this.calculator.setVisibleIds(ids);
    }

    private emit(matched: MatchedQuestion[], unmatched: string[]): void {
        this.postMessage({
            command: 'results',
            value: {
                matched,
                unmatched
            }
        });
    }

    private postMessage(message: FilterWorkerMessage) {
        this.message.next(message);
    }
}
