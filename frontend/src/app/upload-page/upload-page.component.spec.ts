import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { provideMockStore } from '@ngrx/store/testing';

import { initialState } from '../questionnaire.state';
import { UploadPageComponent } from './upload-page.component';

describe('UploadPageComponent', () => {
    let component: UploadPageComponent;
    let fixture: ComponentFixture<UploadPageComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [UploadPageComponent, HttpClientTestingModule, FontAwesomeModule],
            providers: [provideMockStore({ initialState })]
        })
            .compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(UploadPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
