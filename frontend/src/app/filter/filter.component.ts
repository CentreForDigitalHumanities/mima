import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
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
import { combineLatestWith, map, throttleTime, withLatestFrom } from 'rxjs/operators';
import { MultiSelectModule } from 'primeng/multiselect';

import { removeFilter } from '../questionnaire.actions';
import { State } from '../questionnaire.state';
import { Filter } from '../models/filter';
import { QuestionnaireService } from '../services/questionnaire.service';
import { DropdownOption, FilterManagementService } from '../services/filter-management.service';
import { FilterTagsComponent } from '../filter-tags/filter-tags.component';


type FilterType = {
    name: string,
    field: Filter['field'],
    icon: IconDefinition,
    dropdown: boolean,
    placeholder: string
}

@Component({
    selector: 'mima-filter',
    templateUrl: './filter.component.html',
    styleUrls: ['./filter.component.scss'],
    standalone: true,
    imports: [CommonModule, FontAwesomeModule, FormsModule, MultiSelectModule, FilterTagsComponent]
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
        dropdown: false,
        placeholder: $localize`Search in all Fields`
    }, {
        name: $localize`Question`,
        field: 'id',
        icon: faComment,
        dropdown: true,
        placeholder: $localize`Select Question(s)`
    }, {
        name: $localize`Question Text`,
        field: 'prompt',
        icon: faCommentDots,
        dropdown: false,
        placeholder: ''
    }, {
        name: $localize`Translation`,
        field: 'answer',
        icon: faGlobeEurope,
        dropdown: false,
        placeholder: ''
    }, {
        name: $localize`Dialect`,
        field: 'dialect',
        icon: faLanguage,
        dropdown: true,
        placeholder: $localize`Select Dialect(s)`
    }, {
        name: $localize`Participant`,
        field: 'participantId',
        icon: faUser,
        dropdown: true,
        placeholder: $localize`Select Participant(s)`
    }, {
        name: $localize`Attestation`,
        field: 'attestation',
        icon: faUser,
        dropdown: true,
        placeholder: $localize`Select Attested or Unattested`
    }, {
        name: $localize`Gloss`,
        field: 'gloss',
        icon: faUser,
        dropdown: false,
        placeholder: ''
    }, {
        name: $localize`English Translation`,
        field: 'en_translation',
        icon: faUser,
        dropdown: false,
        placeholder: ''
    }, {
        name: $localize`Chapter`,
        field: 'chapter',
        icon: faUser,
        dropdown: true,
        placeholder: $localize`Select Chapter(s)`
    }, {
        name: `Subtags`,
        field: 'subtags',
        icon: faUser,
        dropdown: true,
        placeholder: $localize`Select Tag(s)`
    }];

    textFieldContent: string;
    dropdownOptions$: Observable<DropdownOption[]> = this.store.select('questionnaire', 'questions').pipe(
        combineLatestWith(this.selectedType$),
        map(([questions, selectedType]) => {
            if (selectedType.dropdown) {
                const { labels, options } = this.filterManagementService.filterFieldOptions(
                    selectedType.field,
                    questions);

                this.dropdownLabels = labels;
                return options;
            } else {
                this.dropdownLabels = {};
                return [];
            }
        })
    );

    dropdownLabels: { [value: string]: string };

    constructor(private store: Store<State>, private filterManagementService: FilterManagementService, private questionnaireService: QuestionnaireService) {
        this.selectedType = this.filterTypes[0];
    }

    ngOnInit(): void {
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
        if (!this.selectedType.dropdown) {
            this.filter.content = [this.textFieldContent];
        } else if (this.filter.field !== this.selectedType.field) {
            // changed to a (different) dropdown?
            // remove the current content to prevent ghost values
            // influencing the filtering
            this.filter.content = [];
            this.textFieldContent = '';
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
