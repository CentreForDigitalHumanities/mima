import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdverbialListPageComponent } from './adverbial-list-page.component';

describe('AdverbialListPageComponent', () => {
    let component: AdverbialListPageComponent;
    let fixture: ComponentFixture<AdverbialListPageComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [AdverbialListPageComponent]
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
