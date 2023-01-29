import { Component } from '@angular/core';
import { environment } from '../../environments/environment';

@Component({
    selector: 'mima-footer',
    templateUrl: './footer.component.html',
    styleUrls: ['./footer.component.scss']
})
export class FooterComponent {
    environment = environment;

    constructor() { }

}
