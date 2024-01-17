import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { MultiSelectModule } from 'primeng/multiselect';

import { QuestionnaireListPageComponent } from './questionnaire-list-page.component';
import { initialState } from '../adverbial.state';
import { QuestionnaireItemComponent } from '../questionnaire-item/questionnaire-item.component';
import { FilterListComponent } from '../filter-list/filter-list.component';

describe('QuestionnaireListPageComponent', () => {
    let component: QuestionnaireListPageComponent;
    let fixture: ComponentFixture<QuestionnaireListPageComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [QuestionnaireListPageComponent, QuestionnaireItemComponent, FilterListComponent],
            imports: [HttpClientTestingModule, MultiSelectModule, RouterTestingModule.withRoutes([])],
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
