import { Pipe, PipeTransform, SecurityContext } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MatchedParts } from './models/matched-parts';

@Pipe({
    name: 'highlight',
    standalone: true
})
export class HighlightPipe implements PipeTransform {
    constructor(private sanitizer: DomSanitizer) {
    }

    /**
     * Highlights the matching part by surrounding them with highlight
     * spans.
     * @param text matched and unmatched parts
     * @param skipFullMatch don't place asterisks when the entire text is a match
     * @returns SafeHtml with highlights
     */

    transform(text: MatchedParts, skipFullMatch = false): SafeHtml {
        const highlightedText = text.parts.map(part => {
            const sanitizedText = this.sanitizedLineBreaks(part.text);

            return part.match && (!skipFullMatch || !text.fullMatch) ? `<span class="highlight">${sanitizedText}</span>` : sanitizedText;
        }).join('');

        return this.sanitizer.bypassSecurityTrustHtml(highlightedText);
    }


    private sanitizedLineBreaks(text: string, breakPlaceholder: string = '<br />'): string {
        const substrings = text.split(/[\r\n]{1,2}/g);
        return substrings.map(substring => {
            // preserve whitespace around parts
            return this.sanitizer.sanitize(SecurityContext.HTML, substring).replace(/(^ | $)/g, '&nbsp;');
        }).join(breakPlaceholder);
    }

}
