import { Component } from '@angular/core';
import { BackendService } from './../services/backend.service';

@Component({
    selector: 'mima-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss']
})
export class HomeComponent {
    constructor(private backend: BackendService) { }

}
