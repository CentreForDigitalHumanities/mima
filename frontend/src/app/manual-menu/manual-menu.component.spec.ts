import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManualMenuComponent } from './manual-menu.component';

describe('ManualMenuComponent', () => {
  let component: ManualMenuComponent;
  let fixture: ComponentFixture<ManualMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManualMenuComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ManualMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
