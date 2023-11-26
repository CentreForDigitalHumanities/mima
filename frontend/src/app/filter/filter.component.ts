import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import {
    faAsterisk,
    faTimesCircle,
    faComment,
    faGlobeEurope,
    faLanguage,
    faTrash,
    IconDefinition,
    faUser,
    faCommentDots
} from '@fortawesome/free-solid-svg-icons';
import { Store } from '@ngrx/store';
import { BehaviorSubject, Observable, Subject, Subscription } from 'rxjs';
import { combineLatestWith, debounceTime, map, withLatestFrom } from 'rxjs/operators';
import { removeFilter } from '../questionnaire.actions';
import { State } from '../questionnaire.state';
import { Filter } from '../models/filter';
import { QuestionnaireService } from '../services/questionnaire.service';

type FilterType = {
    name: string,
    field: Filter['field'],
    icon: IconDefinition
} & ({
    dropdown: false
} | {
    dropdown: true,
    dropdownLabel: string
});


interface DropdownOption {
    label: string;
    value: string;
}

@Component({
    selector: 'mima-filter',
    templateUrl: './filter.component.html',
    styleUrls: ['./filter.component.scss']
})
export class FilterComponent implements OnInit, OnDestroy {
    private subscriptions: Subscription[];
    private filters$ = this.store.select('questionnaire', 'filters');
    private index$ = new BehaviorSubject<number>(0);

    faTimesCircle = faTimesCircle;
    faTrash = faTrash;

    keyup$ = new Subject();

    @ViewChild('textField')
    textField: ElementRef<HTMLInputElement>;

    @Input()
    set index(value: number) {
        this.index$.next(value);
    }

    @Output()
    filterChange = new EventEmitter<Filter>();

    selectedType$ = new BehaviorSubject<FilterType>(null);

    set selectedType(value: FilterType) {
        this.selectedType$.next(value);
    }

    get selectedType() {
        return this.selectedType$.value;
    }

    filter: Filter;

    filterTypes: FilterType[] = [{
        name: '',
        field: '*',
        icon: faAsterisk,
        dropdown: false
    }, {
        name: $localize`Question`,
        field: 'id',
        icon: faComment,
        dropdown: true,
        dropdownLabel: $localize`Select Question(s)`
    }, {
        name: $localize`Question Text`,
        field: 'prompt',
        icon: faCommentDots,
        dropdown: false
    }, {
        name: $localize`Translation`,
        field: 'answer',
        icon: faGlobeEurope,
        dropdown: false
    }, {
        name: $localize`Dialect`,
        field: 'dialect',
        icon: faLanguage,
        dropdown: true,
        dropdownLabel: $localize`Select Dialect(s)`
    }, {
        name: $localize`Participant`,
        field: 'participantId',
        icon: faUser,
        dropdown: true,
        dropdownLabel: $localize`Select Participant(s)`
    },];

    textFieldContent: string;
    dropdownOptions$: Observable<DropdownOption[]> = this.store.select('questionnaire', 'questions').pipe(
        combineLatestWith(this.selectedType$),
        map(([questions, selectedType]) => {
            const values: { [value: string]: string } = {};
            for (const [id, question] of questions) {
                if (selectedType.dropdown) {
                    switch (selectedType.field) {
                        case '*':
                            break;

                        case 'dialect':
                            for (let answer of question.answers) {
                                values[answer[selectedType.field]] = answer[selectedType.field];
                            }
                            break;

                        case 'id':
                            values[id] = question.prompt;
                            break;

                        case 'participantId':
                            for (let participant of this.questionnaireService.getParticipants(question.answers)) {
                                values[participant.participantId] = `${participant.participantId} ${participant.dialect}`;
                            }

                            break;

                        default:
                            values[question[selectedType.field]] = question[selectedType.field];
                            break;

                    }
                }
            }

            return Object.entries(values).sort(([x, a], [y, b]) => {
                if (a < b) {
                    return -1;
                } else if (a > b) {
                    return 1;
                }
                return 0;
            }).map<DropdownOption>(([value, label]) => ({
                value,
                label
            }));
        })
    );

    constructor(private store: Store<State>, private questionnaireService: QuestionnaireService) {
        this.selectedType = this.filterTypes[0];
    }

    ngOnInit(): void {
        this.subscriptions = [
            // rate limit the keyboard input
            this.keyup$.pipe(
                debounceTime(50)
            ).subscribe(() => {
                this.emit()
            }),
            this.filters$.pipe(
                withLatestFrom(this.index$),
                map(([filters, index]) => {
                    const filter = filters[index];
                    if (!filter) {
                        return;
                    }

                    const selectedType = this.getSelectedType(filter);

                    if (selectedType !== this.selectedType) {
                        this.selectedType = selectedType;
                    }

                    let content: string[];
                    this.textFieldContent = filter.content[0] ?? '';
                    if (!this.selectedType.dropdown) {
                        content = [this.textFieldContent];
                    } else {
                        content = filter.content;
                    }

                    // make sure the original object isn't modified (side-effect!)
                    this.filter = {
                        ...filter,
                        content,
                        onlyFullMatch: this.selectedType.dropdown
                    };
                })).subscribe()
        ];
    }

    ngOnDestroy(): void {
        for (const subscription of this.subscriptions) {
            subscription.unsubscribe();
        }
    }

    emit(): void {
        if (!this.selectedType.dropdown) {
            this.filter.content = [this.textFieldContent];
        } else if (this.filter.field !== this.selectedType.field) {
            // changed to a (different) dropdown?
            // remove the current content to prevent ghost values
            // influencing the filtering
            this.filter.content = [];
        }

        this.filter.field = this.selectedType.field;
        this.filterChange.emit(this.filter);
    }

    delete(): void {
        this.store.dispatch(removeFilter({ filterIndex: this.index$.value }));
    }

    clearFilter(): void {
        this.filter.content = [];
        this.filterChange.emit(this.filter);
        this.textField.nativeElement.focus();
    }

    private getSelectedType(filter: Filter | undefined): FilterType {
        let selectedType: FilterType;
        if (filter === undefined) {
            // default type
            selectedType = this.filterTypes[0];
        } else {
            selectedType = this.filterTypes.find(x => x.field === filter.field);
        }
        return selectedType;
    }
}
