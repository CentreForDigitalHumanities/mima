import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';


import { LikertListComponent } from './likert-list.component';

describe('LikertListComponent', () => {
  let component: LikertListComponent;
  let fixture: ComponentFixture<LikertListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LikertListComponent, HttpClientTestingModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LikertListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
