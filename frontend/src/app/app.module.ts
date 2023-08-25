import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { APP_BASE_HREF } from '@angular/common';
import { HttpClientModule, HttpClientXsrfModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';

import { LuupzigModule } from 'luupzig';
import { MultiSelectModule } from 'primeng/multiselect';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';

import { AdverbialEffects } from './adverbial.effects';
import { adverbialReducer } from './adverbial.reducer';
import { FooterComponent } from './footer/footer.component';
import { MenuComponent } from './menu/menu.component';
import { HomeComponent } from './home/home.component';
import { UploadComponent } from './upload/upload.component';
import { AdverbialComponent } from './adverbial/adverbial.component';
import { AdverbialListComponent } from './adverbial-list/adverbial-list.component';
import { AdverbialListPageComponent } from './adverbial-list-page/adverbial-list-page.component';
import { UploadPageComponent } from './upload-page/upload-page.component';
import { FilterComponent } from './filter/filter.component';
import { FilterListComponent } from './filter-list/filter-list.component';
import { HighlightPipe } from './highlight.pipe';
import { HighlightPlainPipe } from './highlight-plain.pipe';


@NgModule({
    declarations: [
        AppComponent,
        FooterComponent,
        MenuComponent,
        HomeComponent,
        UploadComponent,
        AdverbialComponent,
        AdverbialListComponent,
        AdverbialListPageComponent,
        UploadPageComponent,
        FilterComponent,
        FilterListComponent,
        HighlightPipe,
        HighlightPlainPipe
    ],
    imports: [
        AppRoutingModule,
        BrowserModule,
        BrowserAnimationsModule,
        FontAwesomeModule,
        FormsModule,
        HttpClientModule,
        HttpClientXsrfModule.withOptions({
            cookieName: 'csrftoken',
            headerName: 'X-CSRFToken'
        }),
        EffectsModule.forRoot([AdverbialEffects]),
        MultiSelectModule,
        LuupzigModule,
        StoreModule.forRoot({
            adverbials: adverbialReducer
        }, {
            runtimeChecks: {
                strictStateImmutability: true,
                strictActionImmutability: true
            }
        }),
    ],
    providers: [
        // The language is used as the base_path for finding the right
        // static-files. For example /nl/static/main.js
        // However the routing is done from a base path starting from
        // the root e.g. /home
        // The server should then switch index.html based on a language
        // cookie with a fallback to Dutch e.g. /nl/static/index.html
        { provide: APP_BASE_HREF, useValue: '/' }
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
