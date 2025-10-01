import { formatNumber } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faLink } from '@fortawesome/free-solid-svg-icons';
import { tokenCount } from '../../environments/counts';

@Component({
    selector: 'mima-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
    imports: [FontAwesomeModule, RouterLink, RouterLinkActive],
    standalone: true
})
export class HomeComponent {
    date: string;
    tokenCount = formatNumber(tokenCount, $localize`en-GB`);
    faLink = faLink;

    constructor() {
        const now = new Date();
        this.date = now.toLocaleString(
            $localize`en-GB`,
            {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
    }

}
