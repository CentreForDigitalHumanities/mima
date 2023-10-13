import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuestionnaireListPageComponent } from './questionnaire-list-page.component';

describe('QuestionnaireListPageComponent', () => {
  let component: QuestionnaireListPageComponent;
  let fixture: ComponentFixture<QuestionnaireListPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ QuestionnaireListPageComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuestionnaireListPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
