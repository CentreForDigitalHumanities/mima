import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { UploadComponent } from '../upload/upload.component';

import { UploadPageComponent } from './upload-page.component';

describe('UploadPageComponent', () => {
    let component: UploadPageComponent;
    let fixture: ComponentFixture<UploadPageComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [UploadPageComponent, UploadComponent],
            imports: [HttpClientTestingModule, FontAwesomeModule]
        })
            .compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(UploadPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
