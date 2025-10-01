import { Pipe, PipeTransform } from '@angular/core';
import { MatchedParts } from './models/matched-parts';
import { DialectService } from './services/dialect.service';

@Pipe({
    name: 'localizeDialect',
    standalone: true
})
export class LocalizeDialectPipe implements PipeTransform {

    constructor(private dialectService: DialectService) {
    }

    transform<T extends MatchedParts | string>(value: T): T {
        if (value instanceof MatchedParts) {
            if (value.parts.length === 1) {
                return <T>new MatchedParts({
                    ...value,
                    parts: value.parts.map(part => ({
                        ...part,
                        text: this.dialectService.localize(part.text)
                    }))
                });
            }

            return value;
        }

        return this.dialectService.localize(value);
    }

}
