import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FilterTagsComponent } from './filter-tags.component';

describe('FilterTagsComponent', () => {
  let component: FilterTagsComponent;
  let fixture: ComponentFixture<FilterTagsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ FilterTagsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FilterTagsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
