/// <reference lib="webworker" />

import 'zone.js';
import { DoBootstrap, enableProdMode, NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { platformBrowserDynamic } from "@angular/platform-browser-dynamic";

import { environment } from '../../environments/environment';

import { FilterService } from "./filter.service";
import { WorkerReceiver } from './filter.worker-receiver';
import { FilterField, FilterObjectName } from '../models/filter';

@NgModule({
    imports: [BrowserModule],
})
export class WorkerModule<T extends FilterObjectName> implements DoBootstrap {
    private receiver!: WorkerReceiver<T>;

    constructor(filterService: FilterService) {
        this.receiver = new WorkerReceiver<T>(filterService);
    }

    ngDoBootstrap() {
        addEventListener('message', (event: { data: any }) => {
            this.receiver.handleMessage({
                command: event.data.command,
                value: event.data.value ? JSON.parse(event.data.value) : undefined
            });
        });

        this.receiver.message$.subscribe(message => {
            postMessage({
                command: message.command,
                value: 'value' in message ? JSON.stringify(message.value) : undefined
            });
        })
    }
}

if (environment.production) {
    enableProdMode();
}

platformBrowserDynamic().bootstrapModule(WorkerModule)
    .catch(err => console.error(err));
