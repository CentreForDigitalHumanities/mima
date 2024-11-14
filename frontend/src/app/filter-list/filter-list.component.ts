import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPlus, faTimes } from '@fortawesome/free-solid-svg-icons';
import { Filter, FilterField, FilterObjectName, FilterOperator, FilterType } from '../models/filter';
import { isEmptyFilter } from '../services/filter.service';
import { FilterFieldOptions } from '../services/filter-management.service';
import { FilterComponent } from '../filter/filter.component';

@Component({
    selector: 'mima-filter-list',
    templateUrl: './filter-list.component.html',
    styleUrls: ['./filter-list.component.scss'],
    standalone: true,
    imports: [CommonModule, FilterComponent, FontAwesomeModule]
})
export class FilterListComponent<T extends FilterObjectName> {
    private _filters: readonly Filter<T>[] = [];

    faPlus = faPlus;
    faTimes = faTimes;

    clearable = false;
    filterIndexes: number[] = [];

    @Input()
    filterTypes: FilterType<T>[];

    @Input()
    getFilterFieldOptions: (field: FilterField<T>) => Observable<FilterFieldOptions>;

    @Input()
    operator: FilterOperator;

    @Input()
    set filters(filters: readonly Filter<T>[]) {
        this._filters = filters;
        this.clearable = !!filters.find(filter => !isEmptyFilter(filter));
        if (this.filterIndexes.length !== filters.length) {
            this.filterIndexes = [];
            for (let i = 0; i < filters.length; i++) {
                this.filterIndexes[i] = i;
            }
        }
    }

    get filters() {
        return this._filters;
    }

    @Output()
    filterChange = new EventEmitter<Filter<T>>();

    @Output()
    add = new EventEmitter<void>();

    @Output()
    clear = new EventEmitter<void>();

    @Output()
    remove = new EventEmitter<number>();

    @Output()
    setOperator = new EventEmitter<FilterOperator>();
}
