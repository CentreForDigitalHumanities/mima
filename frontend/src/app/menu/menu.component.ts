import { Component, LOCALE_ID, Inject, OnInit, NgZone } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { IsActiveMatchOptions, RouterLink, RouterLinkActive } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faGlobe, faSync } from '@fortawesome/free-solid-svg-icons';
import { animations, showState } from '../animations';
import { LanguageInfo, LanguageService } from '../services/language.service';
import { ProgressService } from '../services/progress.service';
import { DarkModeToggleComponent } from '../dark-mode-toggle/dark-mode-toggle.component';

@Component({
    animations,
    selector: 'mima-menu',
    templateUrl: './menu.component.html',
    styleUrls: ['./menu.component.scss'],
    standalone: true,
    imports: [CommonModule, RouterLink, RouterLinkActive, FontAwesomeModule, DarkModeToggleComponent]
})
export class MenuComponent implements OnInit {
    burgerShow: showState;
    burgerActive = false;
    burgerIconActive = false;
    currentLanguage: string;
    loading = false;

    faGlobe = faGlobe;
    faSync = faSync;

    // use the target languages for displaying the respective language names
    languages: LanguageInfo['supported'];
    routerLinkActiveOptions: IsActiveMatchOptions = {
        matrixParams: 'ignored',
        queryParams: 'ignored',
        paths: 'subset',
        fragment: 'ignored',
    };

    constructor(
        @Inject(DOCUMENT) document: Document,
        @Inject(LOCALE_ID) private localeId: string,
        private ngZone: NgZone,
        private progressService: ProgressService,
        private languageService: LanguageService) {
        const window = document.defaultView;
        // Window is undefined on the server
        let isDesktop: boolean;
        try {
            isDesktop = window ? window.matchMedia("screen and (min-width: 1024px)").matches : true;
        } catch (err) {
            // not available in server-mode
            console.error(err);
            isDesktop = true;
        }
        this.burgerShow = isDesktop ? 'show' : 'hide';
        this.currentLanguage = this.localeId;
    }

    async ngOnInit(): Promise<void> {
        // allow switching even when the current locale is different
        // this should really only be the case in development:
        // then the instance is only running in a single language
        const languageInfo = await this.languageService.get();
        this.currentLanguage = languageInfo.current || this.localeId;
        this.languages = languageInfo.supported;
    }

    toggleBurger(): void {
        if (!this.burgerActive) {
            // make it active to make it visible (add a class to
            // override it being hidden for smaller screens)
            this.burgerIconActive = true;
            this.burgerActive = true;
            // immediately hide it
            this.burgerShow = 'hide';
            setTimeout(() => {
                this.ngZone.run(() => {
                    // trigger the transition
                    this.burgerShow = 'show';
                });
            });
            return;
        }

        this.burgerShow = this.burgerShow === 'show' ? 'hide' : 'show';

        // only toggle the menu icon; the menu is hidden by the animation
        this.burgerIconActive = false;
    }

    async setLanguage(language: string): Promise<void> {
        if (this.currentLanguage !== language) {
            this.loading = true;
            this.progressService.start(true);
            await this.languageService.set(language);
            // reload the application to make the server route
            // to the different language version
            document.location.reload();
        }
    }
}
