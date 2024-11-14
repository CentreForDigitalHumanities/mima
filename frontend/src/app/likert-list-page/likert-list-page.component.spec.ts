import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';


import { LikertListPageComponent } from './likert-list-page.component';
import { DarkModeToggleComponent } from '../dark-mode-toggle/dark-mode-toggle.component';
import { initialState } from '../judgments.state';
import { provideMockStore } from '@ngrx/store/testing';
import { RouterTestingModule } from '@angular/router/testing';


describe('LikertListPageComponent', () => {
    let component: LikertListPageComponent;
    let fixture: ComponentFixture<LikertListPageComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [LikertListPageComponent, HttpClientTestingModule, RouterTestingModule.withRoutes([]), DarkModeToggleComponent],
            providers: [provideMockStore({ initialState })]
        })
            .compileComponents();

        fixture = TestBed.createComponent(LikertListPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
