import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManualButtonComponent } from './manual-button.component';

describe('ManualButtonComponent', () => {
  let component: ManualButtonComponent;
  let fixture: ComponentFixture<ManualButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManualButtonComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ManualButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
