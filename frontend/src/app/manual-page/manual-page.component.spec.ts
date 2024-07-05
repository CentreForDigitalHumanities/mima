import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManualPageComponent } from './manual-page.component';
import { RouterTestingModule } from '@angular/router/testing';

describe('ManualPageComponent', () => {
    let component: ManualPageComponent;
    let fixture: ComponentFixture<ManualPageComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ManualPageComponent, RouterTestingModule.withRoutes([])]
        })
            .compileComponents();

        fixture = TestBed.createComponent(ManualPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
