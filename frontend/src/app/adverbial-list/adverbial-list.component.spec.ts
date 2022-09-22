import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdverbialListComponent } from './adverbial-list.component';

describe('AdverbialListComponent', () => {
  let component: AdverbialListComponent;
  let fixture: ComponentFixture<AdverbialListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AdverbialListComponent ]
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
