import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, Observable, of, Subject, Subscription } from 'rxjs';
import { map, switchMap, throttleTime, withLatestFrom } from 'rxjs/operators';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
    faTimesCircle,
    faTrash
} from '@fortawesome/free-solid-svg-icons';
import { MultiSelectModule } from 'primeng/multiselect';

import { Filter, FilterField, FilterObjectName, FilterType } from '../models/filter';
import { DropdownOption, FilterFieldOptions } from '../services/filter-management.service';
import { FilterTagsComponent } from '../filter-tags/filter-tags.component';
import { ManualButtonComponent } from '../manual-button/manual-button.component';
import { DialectSelectionComponent } from '../dialect-selection/dialect-selection.component';

@Component({
    selector: 'mima-filter',
    templateUrl: './filter.component.html',
    styleUrls: ['./filter.component.scss'],
    standalone: true,
    imports: [CommonModule, FontAwesomeModule, FormsModule, ManualButtonComponent, MultiSelectModule, FilterTagsComponent, DialectSelectionComponent]
})
export class FilterComponent<T extends FilterObjectName> implements OnInit, OnDestroy {
    private subscriptions: Subscription[];
    private filterSubject = new BehaviorSubject<readonly Filter<T>[]>([]);
    private filters$ = this.filterSubject.asObservable();
    private index$ = new BehaviorSubject<number>(0);

    faTimesCircle = faTimesCircle;
    faTrash = faTrash;

    keyup$ = new Subject();

    @ViewChild('textField')
    textField: ElementRef<HTMLInputElement>;

    @Input()
    clearable: boolean;

    @Input()
    set filters(filters: readonly Filter<T>[]) {
        this.filterSubject.next(filters);
    }

    @Input()
    filterTypes: FilterType<T>[];

    @Input()
    getFilterFieldOptions: (field: FilterField<T>) => Observable<FilterFieldOptions>;

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
        switchMap((selectedType) => {
            if (selectedType.mode !== 'text') {
                return this.getFilterFieldOptions(selectedType.field);
            }

            return of(null);
        }),
        map((fieldOptions) => {
            if (fieldOptions) {
                const { labels, options } = fieldOptions;

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
                    if (selectedType.mode === 'text') {
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
                        onlyFullMatch: selectedType.mode !== 'text'
                    };
                })).subscribe()
        ];
    }

    ngOnDestroy(): void {
        for (const subscription of this.subscriptions) {
            subscription.unsubscribe();
        }
    }

    /**
     * Emits the updated filter
     * @param content updated filter content (or undefined if unchanged)
     */
    emit(content?: string[]): void {
        if (!content) {
            content = this.filter.content;
        } else {
            this.filter.content = content;
        }

        if (this.selectedType.mode === 'text') {
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
