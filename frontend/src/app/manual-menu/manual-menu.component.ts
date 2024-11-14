import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ManualPageMetadata, ManualService } from '../services/manual.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
    selector: 'mima-manual-menu',
    standalone: true,
    imports: [CommonModule, RouterLink, RouterLinkActive, FontAwesomeModule],
    templateUrl: './manual-menu.component.html',
    styleUrl: './manual-menu.component.scss'
})
export class ManualMenuComponent {
    pages: ManualPageMetadata[];

    constructor(private manualService: ManualService) {
        this.init();
    }

    async init() {
        this.pages = await this.manualService.getManifest();
    }
}
