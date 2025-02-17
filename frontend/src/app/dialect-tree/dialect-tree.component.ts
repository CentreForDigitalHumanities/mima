import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialectService } from '../services/dialect.service';

@Component({
    selector: 'mima-dialect-tree',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './dialect-tree.component.html',
    styleUrl: './dialect-tree.component.scss'
})
export class DialectTreeComponent implements OnChanges {
    @Input()
    root: Set<string>;

    @Input()
    dialects: Set<string>;

    /**
     * Gets the direct children for this dialect; as these
     * are the root for the next level
     */
    children: { [dialect: string]: Set<string> };

    constructor(private dialectService: DialectService) {
    }

    ngOnChanges(changes: SimpleChanges): void {
        const children: DialectTreeComponent['children'] = {};

        for (const name of this.root) {
            const dialect = this.dialectService.dialectLookup.hierarchy[name];
            const dialectChildren = dialect.children
                // show the subdialect if it matched directly
                // or if a (...)(sub)subdialect matched
                .filter(child => this.dialects.has(child.name) || this.dialectService.dialectLookup.hasChild(child, this.dialects))
                .map(child => child.name);

            if (dialectChildren.length) {
                children[name] = new Set(dialectChildren);
            }
        }

        this.children = children;
    }
}
