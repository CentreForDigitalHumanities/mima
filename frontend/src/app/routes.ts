import { Routes } from '@angular/router';

import { HomeComponent } from './home/home.component';
import { UploadPageComponent } from './upload-page/upload-page.component';
import { QuestionnaireListPageComponent } from './questionnaire-list-page/questionnaire-list-page.component';

const routes: Routes = [
    {
        path: 'home',
        component: HomeComponent,
    },
    {
        path: 'upload',
        component: UploadPageComponent
    },
    {
        path: 'questionnaires',
        component: QuestionnaireListPageComponent
    },
    {
        path: '',
        redirectTo: '/home',
        pathMatch: 'full'
    }
];

export { routes };
