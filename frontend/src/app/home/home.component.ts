import { Component } from '@angular/core';
import { BackendService } from './../services/backend.service';
import { IsActiveMatchOptions, RouterLink, RouterLinkActive } from '@angular/router';


@Component({
    selector: 'mima-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
    imports: [RouterLink, RouterLinkActive],
    standalone: true
})
export class HomeComponent {
    constructor(private backend: BackendService) { }

}
