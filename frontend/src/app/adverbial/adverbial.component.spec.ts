import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdverbialComponent } from './adverbial.component';

describe('AdverbialComponent', () => {
  let component: AdverbialComponent;
  let fixture: ComponentFixture<AdverbialComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AdverbialComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AdverbialComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
