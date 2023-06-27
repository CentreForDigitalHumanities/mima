import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import {
    faAsterisk,
    faTimesCircle,
    faComment,
    faGlobeEurope,
    faLanguage,
    faTrash,
    IconDefinition
} from '@fortawesome/free-solid-svg-icons';
import { Store } from '@ngrx/store';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { map, withLatestFrom } from 'rxjs/operators';
import { removeFilter } from '../adverbial.actions';
import { State } from '../adverbial.state';
import { Filter } from '../models/filter';
import * as _ from 'lodash';

interface FilterType {
    name: string;
    field: Filter['field'];
    icon: IconDefinition;
    dropdown: boolean;
}

interface DropdownOption {
    name: string;
}

@Component({
    selector: 'mima-filter',
    templateUrl: './filter.component.html',
    styleUrls: ['./filter.component.scss']
})
export class FilterComponent implements OnInit, OnDestroy {
    private subscriptions: Subscription[];
    private filters$ = this.store.select('adverbials', 'filters');
    private index$ = new BehaviorSubject<number>(0);

    faTimesCircle = faTimesCircle;
    faTrash = faTrash;

    @ViewChild('textField')
    textField: ElementRef<HTMLInputElement>;

    @Input()
    set index(value: number) {
        this.index$.next(value);
    }

    @Output()
    filterChange = new EventEmitter<Filter>();

    selectedType: FilterType;

    filter: Filter;

    filterTypes: FilterType[] = [{
        name: '',
        field: '*',
        icon: faAsterisk,
        dropdown: false
    }, {
        name: $localize `Adverbial`,
        field: 'text',
        icon: faComment,
        dropdown: false
    }, {
        name: $localize  `Dialect`,
        field: 'dialect',
        icon: faLanguage,
        dropdown: true
    }, {
        name: $localize  `Translation`,
        field: 'translations',
        icon: faGlobeEurope,
        dropdown: false
    }];

    textFieldContent: string;
    dropdownOptions$: Observable<DropdownOption[]> = this.store.select('adverbials', 'adverbials').pipe(
        withLatestFrom(this.filters$, this.index$),
        map(([adverbials, filters, index]) => {
            const filter = filters[index];
            const selectedType = this.getSelectedType(filter);

            const values = new Set<string>();
            for (const adverbial of adverbials) {
                if (selectedType.dropdown) {
                    switch (selectedType.field) {
                        case '*':
                            break;

                        case 'labels':
                            for (const value of adverbial.labels) {
                                values.add(value);
                            }
                            break;

                        default:
                            // values.add(adverbial[selectedType.field]);
                            break;

                    }
                }
            }

            return Array.from(values).sort().map<DropdownOption>(name => ({
                name
            }));
        })
    );

    constructor(private store: Store<State>) {
        this.selectedType = this.filterTypes[0];
    }

    ngOnInit(): void {
        this.subscriptions = [
            this.filters$.pipe(
                withLatestFrom(this.index$),
                map(([filters, index]) => {
                    const filter = filters[index];

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
                    this.filter = { ...filter, content };
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
