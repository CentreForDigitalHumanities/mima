import { Component, Input } from '@angular/core';
import { Adverbial, MatchedAdverbial } from '../models/adverbial';
import { faCircleNotch, faCommentDots, faCommentSlash } from '@fortawesome/free-solid-svg-icons';
import { Filter } from '../models/filter';

@Component({
    selector: 'mima-adverbial',
    templateUrl: './adverbial.component.html',
    styleUrls: ['./adverbial.component.scss']
})
export class AdverbialComponent {
    faCircleNotch = faCircleNotch;
    faCommentDots = faCommentDots;
    faCommentSlash = faCommentSlash;
    matchedAdverbial: MatchedAdverbial;
    showNotes = false;

    /**
     * Placeholder for the ID, to be able to find the content
     */
    @Input()
    id: string;

    @Input()
    set adverbial(value: Adverbial | MatchedAdverbial) {
        if (value instanceof MatchedAdverbial) {
            this.matchedAdverbial = value;
        } else {
            this.matchedAdverbial = new MatchedAdverbial(value);
        }
    }

    @Input()
    filters: Filter[];
}
