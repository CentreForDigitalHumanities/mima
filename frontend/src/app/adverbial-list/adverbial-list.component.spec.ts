import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { AdverbialComponent } from '../adverbial/adverbial.component';

import { AdverbialListComponent } from './adverbial-list.component';

describe('AdverbialListComponent', () => {
    let component: AdverbialListComponent;
    let fixture: ComponentFixture<AdverbialListComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [AdverbialListComponent, AdverbialComponent],
            imports: [FontAwesomeModule]
        })
            .compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(AdverbialListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
