import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { APP_BASE_HREF } from '@angular/common';
import { HttpClientModule, HttpClientXsrfModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';

import { LuupzigModule } from 'luupzig';
import { DropdownModule } from 'primeng/dropdown';
import { PanelModule } from 'primeng/panel';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';

import { QuestionnaireEffects } from './questionnaire.effects';
import { questionnaireReducer } from './questionnaire.reducer';

import { FooterComponent } from './footer/footer.component';
import { MenuComponent } from './menu/menu.component';
import { HomeComponent } from './home/home.component';
import { UploadComponent } from './upload/upload.component';
import { UploadPageComponent } from './upload-page/upload-page.component';
import { FilterComponent } from './filter/filter.component';
import { FilterListComponent } from './filter-list/filter-list.component';
import { HighlightPipe } from './highlight.pipe';
import { HighlightPlainPipe } from './highlight-plain.pipe';
import { QuestionnaireListPageComponent } from './questionnaire-list-page/questionnaire-list-page.component';
import { QuestionnaireItemComponent } from './questionnaire-item/questionnaire-item.component';
import { DownloadButtonComponent } from './download-button/download-button.component';
import { ProgressComponent } from './progress/progress.component';
import { TransitionNumbersPipe } from './transition-numbers.pipe';
import { QuestionnaireListComponent } from './questionnaire-list/questionnaire-list.component';
import { DarkModeToggleComponent } from './dark-mode-toggle/dark-mode-toggle.component';
import { ManualButtonComponent } from './manual-button/manual-button.component';


@NgModule({
    declarations: [
        AppComponent,
        FooterComponent,
        MenuComponent,
        HomeComponent,
        UploadComponent,
        UploadPageComponent,
        FilterListComponent,
        HighlightPlainPipe,
        QuestionnaireListPageComponent,
        TransitionNumbersPipe
    ],
    imports: [
        AppRoutingModule,
        BrowserModule,
        BrowserAnimationsModule,
        DropdownModule,
        FilterComponent,
        FontAwesomeModule,
        FormsModule,
        HttpClientModule,
        HttpClientXsrfModule.withOptions({
            cookieName: 'csrftoken',
            headerName: 'X-CSRFToken'
        }),
        EffectsModule.forRoot([QuestionnaireEffects]),
        LuupzigModule,
        PanelModule,
        StoreModule.forRoot({
            questionnaire: questionnaireReducer
        }, {
            runtimeChecks: {
                strictStateImmutability: true,
                strictActionImmutability: true
            }
        }),
        DownloadButtonComponent,
        HighlightPipe,
        ProgressComponent,
        QuestionnaireItemComponent,
        QuestionnaireListComponent,
        DarkModeToggleComponent,
        ManualButtonComponent
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
