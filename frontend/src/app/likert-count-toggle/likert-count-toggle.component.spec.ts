import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LikertCountToggleComponent } from './likert-count-toggle.component';

describe('LikertCountToggleComponent', () => {
  let component: LikertCountToggleComponent;
  let fixture: ComponentFixture<LikertCountToggleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LikertCountToggleComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LikertCountToggleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
