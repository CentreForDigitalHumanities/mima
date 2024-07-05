import { Component, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { MenuComponent } from './menu/menu.component';
import { FooterComponent } from './footer/footer.component';
import { DarkModeService } from './services/dark-mode.service';
import { ProgressComponent } from './progress/progress.component';

@Component({
    selector: 'mima-root',
    standalone: true,
    imports: [RouterOutlet, MenuComponent, FooterComponent, ProgressComponent],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss'
})
export class AppComponent {
    title = 'mima';

    constructor(@Inject(DOCUMENT) document: Document, darkModeService: DarkModeService) {
        const style = document.createElement('link');
        style.rel = 'stylesheet';

        try {
            document.head.append(style);
        } catch (err) {
            console.error(err);
            // cannot render in server-mode
            return;
        }

        darkModeService.theme$.subscribe(theme => {
            document.documentElement.classList.remove(theme === 'dark' ? 'theme-light' : 'theme-dark');
            document.documentElement.classList.add('theme-' + theme);

            style.href = `${theme}.css`;
        });
    }

}
