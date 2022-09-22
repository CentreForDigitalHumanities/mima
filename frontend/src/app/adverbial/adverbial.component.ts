import { Component, Input } from '@angular/core';
import { Adverbial } from '../models/adverbial';
import { faCommentDots } from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'mima-adverbial',
    templateUrl: './adverbial.component.html',
    styleUrls: ['./adverbial.component.scss']
})
export class AdverbialComponent {
    faCommentDots = faCommentDots;

    @Input()
    adverbial: Adverbial;

}
