import { Pipe, PipeTransform, SecurityContext } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Adverbial } from './models/adverbial';
import { Filter } from './models/filter';
import { FilterService } from './services/filter.service';

@Pipe({
    name: 'highlight'
})
export class HighlightPipe implements PipeTransform {
    constructor(private sanitizer: DomSanitizer, private filterService: FilterService) {
    }

    transform(text: string, field: keyof Adverbial, filters: Filter[] = []): SafeHtml {
        const parts = Array.from(this.filterService.highlightFilterMatches(text, field, filters));
        const highlightedText = parts.map(part => {
            const sanitizedText = this.sanitizedLineBreaks(part.part, '<br />');

            return part.match ? `<span class="highlight">${sanitizedText}</span>` : sanitizedText;
        }).join('');

        return this.sanitizer.bypassSecurityTrustHtml(highlightedText);
    }


    private sanitizedLineBreaks(text: string, breakPlaceholder: string): string {
        const substrings = text.split(/[\r\n]{1,2}/g);
        return substrings.map(substring => {
            return this.sanitizer.sanitize(SecurityContext.HTML, substring);
        }).join(breakPlaceholder);
    }

}
