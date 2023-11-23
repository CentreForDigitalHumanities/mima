import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { QuestionnaireListPageComponent } from './questionnaire-list-page.component';
import { initialState } from '../adverbial.state';
import { QuestionnaireItemComponent } from '../questionnaire-item/questionnaire-item.component';

describe('QuestionnaireListPageComponent', () => {
  let component: QuestionnaireListPageComponent;
  let fixture: ComponentFixture<QuestionnaireListPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ QuestionnaireListPageComponent, QuestionnaireItemComponent ],
      imports: [HttpClientTestingModule],
      providers: [provideMockStore({ initialState })]
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
