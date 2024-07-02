import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LikertListPageComponent } from './likert-list-page.component';

describe('LikertListPageComponent', () => {
  let component: LikertListPageComponent;
  let fixture: ComponentFixture<LikertListPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LikertListPageComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LikertListPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
