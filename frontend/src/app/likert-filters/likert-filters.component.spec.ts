import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { provideMockStore } from '@ngrx/store/testing';

import { LikertFiltersComponent } from './likert-filters.component';
import { initialState } from '../judgments.state';

describe('LikertFiltersComponent', () => {
    let component: LikertFiltersComponent;
    let fixture: ComponentFixture<LikertFiltersComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [LikertFiltersComponent, HttpClientTestingModule, RouterTestingModule.withRoutes([])],
            providers: [provideMockStore({ initialState })]
        })
            .compileComponents();

        fixture = TestBed.createComponent(LikertFiltersComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
