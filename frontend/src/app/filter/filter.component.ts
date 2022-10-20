import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { faAsterisk, faComment, faGlobe, faGlobeEurope, faLanguage, IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { Filter } from '../models/filter';

interface FilterType {
    name: string;
    field: Filter['field'];
    icon: IconDefinition;
}

@Component({
    selector: 'mima-filter',
    templateUrl: './filter.component.html',
    styleUrls: ['./filter.component.scss']
})
export class FilterComponent implements OnInit {
    @Input()
    set filter(value: Filter) {
        let selectedType: FilterType;
        if (value === undefined) {
            // default type
            selectedType = this.filterTypes[0];
        } else {
            selectedType = this.filterTypes.find(x => x.field === value.field);
        }

        if (selectedType !== this.selectedType) {
            this.selectedType = this.selectedType;
        }

        // make sure the original object isn't modified (side-effect!)
        this.value = { ...value };
    }

    @Output()
    filterChange = new EventEmitter<Filter>();

    selectedType: FilterType;

    value: Filter;

    filterTypes: FilterType[] = [{
        name: '',
        field: '*',
        icon: faAsterisk
    }, {
        name: 'Adverbial',
        field: 'text',
        icon: faComment
    }, {
        name: 'Dialect',
        field: 'dialect',
        icon: faLanguage
    }, {
        name: 'Translation',
        field: 'translation',
        icon: faGlobeEurope
    }];

    constructor() {
        this.selectedType = this.filterTypes[0];
    }

    ngOnInit(): void {
    }

    emit(): void {
        this.value.field = this.selectedType.field;
        this.filterChange.emit(this.value);
    }

}
