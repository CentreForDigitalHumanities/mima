import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';


import { LikertComponent } from './likert.component';

describe('LikertComponent', () => {
  let component: LikertComponent;
  let fixture: ComponentFixture<LikertComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LikertComponent, HttpClientTestingModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LikertComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
