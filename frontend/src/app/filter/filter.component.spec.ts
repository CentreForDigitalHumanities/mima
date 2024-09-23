import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { provideMockStore } from '@ngrx/store/testing';

import { initialState } from '../questionnaire.state';
import { FilterComponent } from './filter.component';

describe('FilterComponent', () => {
    let component: FilterComponent<'question'>;
    let fixture: ComponentFixture<FilterComponent<'question'>>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [],
            imports: [FilterComponent<'question'>, HttpClientTestingModule],
            providers: [provideMockStore({ initialState })]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(FilterComponent<'question'>);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
