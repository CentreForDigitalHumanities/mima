import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { provideMockStore } from '@ngrx/store/testing';

import { initialState } from '../questionnaire.state';
import { FilterListComponent } from './filter-list.component';

describe('FilterListComponent', () => {
    let component: FilterListComponent;
    let fixture: ComponentFixture<FilterListComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [FilterListComponent, HttpClientTestingModule, RouterTestingModule.withRoutes([])],
            providers: [provideMockStore({ initialState })]
        })
            .compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(FilterListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
