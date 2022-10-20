import { Component, Input } from '@angular/core';
import { Adverbial } from '../models/adverbial';
import { Filter } from '../models/filter';

@Component({
    selector: 'mima-adverbial-list',
    templateUrl: './adverbial-list.component.html',
    styleUrls: ['./adverbial-list.component.scss']
})
export class AdverbialListComponent {
    @Input()
    adverbials: Adverbial[];

    @Input()
    filters: Filter[];
}
