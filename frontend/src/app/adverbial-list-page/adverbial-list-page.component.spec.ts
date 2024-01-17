import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { provideMockStore } from '@ngrx/store/testing';

import { AdverbialListComponent } from '../adverbial-list/adverbial-list.component';
import { initialState } from '../adverbial.state';
import { FilterListComponent } from '../filter-list/filter-list.component';
import { FilterComponent } from '../filter/filter.component';

import { AdverbialListPageComponent } from './adverbial-list-page.component';

describe('AdverbialListPageComponent', () => {
    let component: AdverbialListPageComponent;
    let fixture: ComponentFixture<AdverbialListPageComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [AdverbialListPageComponent, FilterComponent, FilterListComponent, AdverbialListComponent],
            imports: [FormsModule, FontAwesomeModule, HttpClientTestingModule, RouterTestingModule.withRoutes([])],
            providers: [provideMockStore({ initialState })]
        })
            .compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(AdverbialListPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
