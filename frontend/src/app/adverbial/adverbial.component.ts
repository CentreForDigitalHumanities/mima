import { Component, Input } from '@angular/core';
import { Adverbial } from '../models/adverbial';
import { faCommentDots } from '@fortawesome/free-solid-svg-icons';
import { Filter } from '../models/filter';

@Component({
    selector: 'mima-adverbial',
    templateUrl: './adverbial.component.html',
    styleUrls: ['./adverbial.component.scss']
})
export class AdverbialComponent {
    faCommentDots = faCommentDots;

    @Input()
    adverbial: Adverbial;

    @Input()
    filters: Filter[];
}
