import { Component, Inject } from '@angular/core';
import { DarkModeService } from './services/dark-mode.service';
import { DOCUMENT } from '@angular/common';

@Component({
    selector: 'mima-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent {
    title = 'mima';

    constructor(@Inject(DOCUMENT) document: Document, darkModeService: DarkModeService) {
        const style = document.createElement('link');
        style.rel = 'stylesheet';

        document.head.append(style);

        darkModeService.theme$.subscribe(theme => {
            document.documentElement.classList.remove(theme === 'dark' ? 'theme-light' : 'theme-dark');
            document.documentElement.classList.add('theme-' + theme);

            style.href = `${theme}.css`;
        });
    }

}
