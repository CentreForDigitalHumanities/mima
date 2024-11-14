import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LikertBarComponent } from './likert-bar.component';

describe('LikertBarComponent', () => {
  let component: LikertBarComponent;
  let fixture: ComponentFixture<LikertBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LikertBarComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LikertBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
