import { Component, LOCALE_ID, Inject, OnInit, NgZone } from '@angular/core';
import { faGlobe } from '@fortawesome/free-solid-svg-icons';
import { CookieService } from 'ngx-cookie-service';
import { animations, showState } from '../animations';

const LANGUAGE_COOKIE_KEY = 'language';

@Component({
    animations,
    selector: 'mima-menu',
    templateUrl: './menu.component.html',
    styleUrls: ['./menu.component.scss']
})
export class MenuComponent implements OnInit {
    burgerShow: showState;
    burgerActive = false;
    currentLanguage: string;

    faGlobe = faGlobe;

    // use the target languages for displaying the respective language names
    languages = [
        { code: 'nl', name: 'Nederlands' },
        { code: 'en', name: 'English' }
    ];

    constructor(
        @Inject(LOCALE_ID) private localeId: string,
        private ngZone: NgZone,
        private cookieService: CookieService) { }

    ngOnInit(): void {
        // allow switching even when the current locale is different
        // this should really only be the case in development:
        // then the instance is only running in a single language
        this.currentLanguage = this.cookieService.get(LANGUAGE_COOKIE_KEY) || this.localeId;
    }

    toggleBurger(): void {
        if (!this.burgerActive) {
            // make it active to make it visible (add a class to
            // override it being hidden for smaller screens)
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
    }

    setLanguage(language: string): void {
        if (this.currentLanguage !== language) {
            this.cookieService.set(LANGUAGE_COOKIE_KEY, language);
            // reload the application to make the server route
            // to the different language version
            document.location.reload();
        }
    }
}
