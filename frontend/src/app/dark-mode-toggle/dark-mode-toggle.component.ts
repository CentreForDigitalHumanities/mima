import { Component, OnDestroy } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faSun, faMoon } from '@fortawesome/free-solid-svg-icons';
import { DarkModeService } from '../services/dark-mode.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'mima-dark-mode-toggle',
    standalone: true,
    imports: [FontAwesomeModule],
    templateUrl: './dark-mode-toggle.component.html',
    styleUrl: './dark-mode-toggle.component.scss'
})
export class DarkModeToggleComponent implements OnDestroy {
    private subscriptions!: Subscription[];
    faSun = faSun;
    faMoon = faMoon;
    dark = false;

    constructor(private darkModeService: DarkModeService) {
        this.subscriptions = [
            this.darkModeService.theme$.subscribe(theme => this.dark = theme === 'dark')];
    }

    toggle() {
        this.darkModeService.toggle();
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach(s => s.unsubscribe());
    }
}
