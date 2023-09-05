import { Component, Input } from '@angular/core';
import { Adverbial, MatchedAdverbial, MatchedParts } from '../models/adverbial';
import { faCircleNotch, faCommentDots, faCommentSlash, faCaretDown } from '@fortawesome/free-solid-svg-icons';
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
    faCaretDown = faCaretDown;
    examplesExpanded = false;
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

    /**
     * @param array : MatchedParts[], an array of MatchedParts that can contain duplicates
     * @returns newarray : MatchedParts[], an array of MatchedParts that contains no duplicates
     */
    public unique(array: MatchedParts[]): MatchedParts[] {
        let uniques = [];
        let newarray = [];
        for (let i = 0; i < array.length; i++) {
            if (array[i].text && !uniques.includes(array[i].text)) {
                uniques.push(array[i].text);
                newarray.push(array[i]);
            }
        }
        return newarray;
    }

    public onExpandExamples() {
        this.examplesExpanded = !this.examplesExpanded;
    }
}
