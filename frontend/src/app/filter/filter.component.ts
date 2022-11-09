import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { faAsterisk, faComment, faGlobeEurope, faLanguage, IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { Store } from '@ngrx/store';
import { BehaviorSubject, Subscription } from 'rxjs';
import { map, withLatestFrom } from 'rxjs/operators';
import { State } from '../adverbial.state';
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
export class FilterComponent implements OnInit, OnDestroy {
    private subscriptions: Subscription[];
    private filters$ = this.store.select('adverbials', 'filters');
    private index$ = new BehaviorSubject<number>(0);

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

    constructor(private store: Store<State>) {
        this.selectedType = this.filterTypes[0];
    }

    ngOnInit(): void {
        this.subscriptions = [
            this.filters$.pipe(
                withLatestFrom(this.index$),
                map(([filters, index]) => {
                    const filter = filters[index];
                    let selectedType: FilterType;
                    if (filter === undefined) {
                        // default type
                        selectedType = this.filterTypes[0];
                    } else {
                        selectedType = this.filterTypes.find(x => x.field === filter.field);
                    }

                    if (selectedType !== this.selectedType) {
                        this.selectedType = selectedType;
                    }

                    // make sure the original object isn't modified (side-effect!)
                    this.filter = { ...filter };
                })).subscribe()
        ];
    }

    ngOnDestroy(): void {
        for (const subscription of this.subscriptions) {
            subscription.unsubscribe();
        }
    }

    emit(): void {
        this.filter.field = this.selectedType.field;
        this.filterChange.emit(this.filter);
    }

}
