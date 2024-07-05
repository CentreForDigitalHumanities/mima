import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { provideMockStore } from '@ngrx/store/testing';

import { QuestionnaireListPageComponent } from './questionnaire-list-page.component';
import { initialState } from '../questionnaire.state';

describe('QuestionnaireListPageComponent', () => {
    let component: QuestionnaireListPageComponent;
    let fixture: ComponentFixture<QuestionnaireListPageComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [QuestionnaireListPageComponent, HttpClientTestingModule, RouterTestingModule.withRoutes([])],
            providers: [provideMockStore({ initialState })]
        })
            .compileComponents();

        fixture = TestBed.createComponent(QuestionnaireListPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
