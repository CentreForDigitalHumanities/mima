import { Injectable } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { BehaviorSubject } from 'rxjs';
import { marked } from 'marked';
import { Cache, CacheService } from './cache.service';
import { ProgressService } from './progress.service';

@Injectable({
    providedIn: 'root'
})
export class ManualService {
    private behavior = new BehaviorSubject<ManualPageEvent>({ status: 'hide' });
    private manifest: Promise<ManualPageMetadata[]> | undefined;

    public pageEvent = this.behavior.asObservable();
    cache: Cache<ManualPage>;

    public constructor(
        private domSanitizer: DomSanitizer,
        private progressService: ProgressService,
        cacheService: CacheService) {
        this.cache = cacheService.init('manual');
    }

    public closePage() {
        this.behavior.next({ status: 'hide' });
    }

    public async getManualPage(id: string) {
        return this.cache.get(id, async () => {
            const progress = this.progressService.start(true);
            try {
                const path = this.getLocalizedPath(`manual`, `${id}.md`);
                const response = await fetch(path);
                const html = await this.parseResponse(response);
                const manifest = await this.getManifest();
                const title = manifest.find(page => page.id === id)?.title;
                return { id, html, title };
            }
            finally {
                progress.complete();
            }
        });
    }

    public async getManifest(): Promise<ManualPageMetadata[]> {
        if (this.manifest) {
            return this.manifest;
        }

        const path = this.getLocalizedPath(`manual`, `/manifest.json`);
        let result: ManualPageMetadata[];
        try {
            const response = await fetch(path);
            if (response.ok) {
                result = await response.json();
            } else {
                console.error(response);
            }
        }
        catch (exception) {
            console.error(exception);
        }
        finally {
            return result ?? [];
        }
    }

    /**
     * Requests that a manual page should be shown to the user.
     *
     * @param id Name of the page
     */
    public async showManualPage(id: string) {
        this.behavior.next({
            status: 'loading'
        });
        const { html, title } = await this.getManualPage(id);

        this.behavior.next({
            id,
            html,
            title,
            status: 'show'
        });
    }

    private getLocalizedPath(directory: string, fileName: string) {
        return `assets/${directory}/${$localize`en-GB`}/${fileName}`;
    }

    private async parseResponse(response: Response) {
        const text = await response.text();
        const html = await marked.parse(text);
        // mark that the output of the markdown service is safe to accept: it can contain style and id attributes,
        // which normally aren't liked by Angular
        return this.domSanitizer.bypassSecurityTrustHtml(html.replace(/<a rel="noopener" href=/g, '<a target="_blank" href='));
    }
}

export type ManualPageEvent =
    {
        status: 'loading' | 'hide';
    } | {
        status: 'show';
    } & ManualPage;

export interface ManualPageMetadata {
    title: string;
    id: string;
}

export interface ManualPage extends ManualPageMetadata {
    html: SafeHtml;
}
