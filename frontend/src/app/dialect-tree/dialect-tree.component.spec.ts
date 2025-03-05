import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialectTreeComponent } from './dialect-tree.component';

describe('DialectTreeComponent', () => {
  let component: DialectTreeComponent;
  let fixture: ComponentFixture<DialectTreeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialectTreeComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DialectTreeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
