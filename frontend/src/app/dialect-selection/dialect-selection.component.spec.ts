import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialectSelectionComponent } from './dialect-selection.component';

describe('DialectSelectionComponent', () => {
  let component: DialectSelectionComponent;
  let fixture: ComponentFixture<DialectSelectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialectSelectionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DialectSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
