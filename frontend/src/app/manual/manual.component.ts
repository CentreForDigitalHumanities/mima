import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SafeHtml } from '@angular/platform-browser';
import { ManualService } from '../services/manual.service';

@Component({
    selector: 'mima-manual',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './manual.component.html',
    styleUrl: './manual.component.scss'
})
export class ManualComponent implements OnChanges {
    @Input()
    id: string;

    @Input()
    showTitle = true;

    loading = true;
    title: string;
    content: SafeHtml;

    constructor(private manualService: ManualService) { }

    async ngOnChanges(changes: SimpleChanges): Promise<void> {
        this.loading = true;
        const page = await this.manualService.getManualPage(this.id);
        this.title = page.title;
        this.content = page.html;
        this.loading = false;
    }

}
