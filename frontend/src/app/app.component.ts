import { Component, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ProgressService } from './services/progress.service';

@Component({
    selector: 'mima-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent {
    title = 'mima';

}
