import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ManualComponent } from "../manual/manual.component";
import { ManualMenuComponent } from '../manual-menu/manual-menu.component';

@Component({
    selector: 'mima-manual-page',
    standalone: true,
    templateUrl: './manual-page.component.html',
    styleUrl: './manual-page.component.scss',
    imports: [ManualComponent, ManualMenuComponent]
})
export class ManualPageComponent {
    id: string;

    constructor(activatedRoute: ActivatedRoute) {
        activatedRoute.paramMap.subscribe(async params => {
            this.id = params.get('id');
        });
    }
}
