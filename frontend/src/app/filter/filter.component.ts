import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
    faTimesCircle,
    faTrash
} from '@fortawesome/free-solid-svg-icons';
import { BehaviorSubject, Observable, Subject, Subscription } from 'rxjs';
import { map, throttleTime, withLatestFrom } from 'rxjs/operators';
import { MultiSelectModule } from 'primeng/multiselect';

import { Filter, FilterField, FilterObjectName, FilterType } from '../models/filter';
import { DropdownOption, FilterFieldOptions } from '../services/filter-management.service';
import { FilterTagsComponent } from '../filter-tags/filter-tags.component';



@Component({
    selector: 'mima-filter',
    templateUrl: './filter.component.html',
    styleUrls: ['./filter.component.scss'],
    standalone: true,
    imports: [CommonModule, FontAwesomeModule, FormsModule, MultiSelectModule, FilterTagsComponent]
})
export class FilterComponent<T extends FilterObjectName> implements OnInit, OnDestroy {
    private subscriptions: Subscription[];
    private filterSubject = new BehaviorSubject<readonly Filter<T>[]>([]);
    private filters$ = this.filterSubject.asObservable(); // this.store.select('questionnaire', 'filters');
    private index$ = new BehaviorSubject<number>(0);

    faTimesCircle = faTimesCircle;
    faTrash = faTrash;

    keyup$ = new Subject();

    @ViewChild('textField')
    textField: ElementRef<HTMLInputElement>;

    @Input()
    set filters(filters: readonly Filter<T>[]) {
        this.filterSubject.next(filters);
    }

    @Input()
    filterTypes: FilterType<T>[];

    @Input()
    getFilterFieldOptions: (field: FilterField<T>) => FilterFieldOptions;

    @Input()
    set index(value: number) {
        this.index$.next(value);
    }

    @Output()
    remove = new EventEmitter<number>();

    @Output()
    filterChange = new EventEmitter<Filter<T>>();

    selectedType$ = new BehaviorSubject<FilterType<T>>(null);

    set selectedType(value: FilterType<T>) {
        this.selectedType$.next(value);
    }

    get selectedType() {
        return this.selectedType$.value;
    }

    filter: Filter<T>;

    textFieldContent: string;
    dropdownOptions$: Observable<DropdownOption[]> = this.selectedType$.pipe(
        map((selectedType) => {
            if (selectedType.dropdown) {
                const { labels, options } = this.getFilterFieldOptions(selectedType.field);

                this.dropdownLabels = labels;
                return options;
            } else {
                this.dropdownLabels = {};
                return [];
            }
        })
    );

    dropdownLabels: { [value: string]: string };

    ngOnInit(): void {
        if (this.filterTypes) {
            this.selectedType = this.filterTypes[0];
        }
        this.subscriptions = [
            // rate limit the keyboard input
            this.keyup$.pipe(
                throttleTime(150, undefined, { leading: true, trailing: true })
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
                    if (!this.selectedType.dropdown) {
                        content = [this.textFieldContent];
                        this.textFieldContent = filter.content[0] ?? '';
                    } else {
                        content = filter.content;
                        this.textFieldContent = '';
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
        let content = this.filter.content;
        if (!this.selectedType.dropdown) {
            content = [this.textFieldContent];
        } else if (this.filter.field !== this.selectedType.field) {
            // changed to a (different) dropdown?
            // remove the current content to prevent ghost values
            // influencing the filtering
            content = [];
            this.textFieldContent = '';
        }

        this.filterChange.emit({
            ...this.filter,
            field: this.selectedType.field,
            content
        });
    }

    clearFilter(): void {
        this.filter.content = [];
        this.filterChange.emit(this.filter);
        this.textField.nativeElement.focus();
    }

    private getSelectedType(filter: Filter<T> | undefined): FilterType<T> {
        let selectedType: FilterType<T>;
        if (filter === undefined) {
            // default type
            selectedType = this.filterTypes[0];
        } else {
            selectedType = this.filterTypes.find(x => x.field === filter.field);
        }
        return selectedType;
    }
}
