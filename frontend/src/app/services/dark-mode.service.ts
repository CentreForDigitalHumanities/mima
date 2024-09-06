import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Bulma theme
 */
type Theme = 'dark' | 'light';

@Injectable({
    providedIn: 'root'
})
export class DarkModeService {
    /**
     * Whether the user's system is set to use dark mode.
     */
    private system!: Theme;

    private theme!: BehaviorSubject<Theme>;
    theme$: Observable<Theme>;

    constructor(@Inject(DOCUMENT) document: Document) {
        const window = document.defaultView;
        this.system =
            window.matchMedia &&
                window.matchMedia("(prefers-color-scheme: dark)").matches
                ? 'dark'
                : 'light';
        this.theme = new BehaviorSubject<Theme>(this.get() ?? this.system);
        this.theme$ = this.theme.asObservable();
    }

    /**
     * Gets the user's theme or null if they did not set anything
     * @returns
     */
    private get(): Theme | null {
        if (typeof localStorage == 'undefined') {
            return null;
        }
        return <Theme | null>localStorage.getItem('theme');
    }

    /**
     * Sets the user's theme
     * @param value user setting or null if it should depend on the system
     */
    private set(value: Theme | null): void {
        if (value == null) {
            localStorage.removeItem('theme');
        } else {
            localStorage.setItem('theme', value);
        }
    }

    toggle() {
        const target: Theme = this.theme.value === 'dark' ? 'light' : 'dark';
        if (target === this.system) {
            // restore to system setting - if the user might change that
            // system's setting later on this application will follow
            this.set(null);
        } else {
            this.set(target);
        }

        this.theme.next(target);
    }
}
