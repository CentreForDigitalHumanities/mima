import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Filter } from '../models/filter';

@Component({
    selector: 'mima-filter-list',
    templateUrl: './filter-list.component.html',
    styleUrls: ['./filter-list.component.scss']
})
export class FilterListComponent implements OnInit {
    filters: Filter[] = [{ index: 0, field: '*', text: '' }];

    @Output()
    filtersChange = new EventEmitter<Filter[]>();

    constructor() { }

    ngOnInit(): void {
    }

    filterChange(updated: Filter): void {
        Object.assign(this.filters[updated.index], updated);
        this.filtersChange.next(this.filters);
    }

}
