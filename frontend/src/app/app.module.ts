import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HttpClientXsrfModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';

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
        })
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule { }
