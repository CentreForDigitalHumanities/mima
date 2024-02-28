import { Pipe, PipeTransform } from '@angular/core';
import { MatchedParts } from './models/matched-parts';

@Pipe({
    name: 'highlightPlain'
})
export class HighlightPlainPipe implements PipeTransform {
    /**
     * Highlights the matching part by surrounding them with *asterisks*
     * @param text matched and unmatched parts
     * @param skipFullMatch don't place asterisks when the entire text is a match
     */
    transform(text: MatchedParts, skipFullMatch = false): string {
        const highlightedText = text.parts.map(part => {
            return part.match && (!skipFullMatch || !text.fullMatch) ? `*${part.text}*` : part.text;
        }).join('');

        return highlightedText;
    }

}
