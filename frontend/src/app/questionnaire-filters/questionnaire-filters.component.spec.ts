import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { provideMockStore } from '@ngrx/store/testing';

import { QuestionnaireFiltersComponent } from './questionnaire-filters.component';
import { initialState } from '../questionnaire.state';

describe('QuestionnaireFiltersComponent', () => {
    let component: QuestionnaireFiltersComponent;
    let fixture: ComponentFixture<QuestionnaireFiltersComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [QuestionnaireFiltersComponent, HttpClientTestingModule, RouterTestingModule.withRoutes([])],
            providers: [provideMockStore({ initialState })]
        })
            .compileComponents();

        fixture = TestBed.createComponent(QuestionnaireFiltersComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
