import { Routes } from '@angular/router';

import { AdverbialListPageComponent } from './adverbial-list-page/adverbial-list-page.component';
import { HomeComponent } from './home/home.component';
import { UploadPageComponent } from './upload-page/upload-page.component';

const routes: Routes = [
    {
        path: 'home',
        component: HomeComponent,
    },
    {
        path: 'adverbials',
        component: AdverbialListPageComponent
    },
    {
        path: 'upload',
        component: UploadPageComponent
    },
    {
        path: '',
        redirectTo: '/home',
        pathMatch: 'full'
    }
];

export { routes };
