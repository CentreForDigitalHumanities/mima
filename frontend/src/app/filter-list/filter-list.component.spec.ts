import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FilterComponent } from '../filter/filter.component';

import { FilterListComponent } from './filter-list.component';

describe('FilterListComponent', () => {
    let component: FilterListComponent;
    let fixture: ComponentFixture<FilterListComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [FilterListComponent, FilterComponent],
            imports: [FormsModule, FontAwesomeModule]
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
