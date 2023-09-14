import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { Adverbial } from '../models/adverbial';
import { ValidationErrors } from '../models/validationError';

@Injectable({
    providedIn: 'root'
})
export class FileUploadService {
    baseApiUrl = '/api';
    constructor(private http: HttpClient) { }

    /***
     * @throws ValidationErrors
     */
    async upload(file: File): Promise<Adverbial[]> {

        // Create form data
        const formData = new FormData();

        // Store form name as "file" with file data
        formData.append('file', file, file.name);

        // Make http post request over api
        // with formData as req
        const response = lastValueFrom(this.http.post<Adverbial[]>(
            this.baseApiUrl + '/upload/upload/', formData));

        try {
            return await response;
        } catch (error) {
            if (error instanceof HttpErrorResponse) {
                throw new ValidationErrors(error.error);
            }
            throw error;
        }
    }

    /***
     * Temporary method to quickly load data into the frontend from a path
     */
    async uploadPilot(filepath: string): Promise<Adverbial[]> {

        // Make http post request over api
        const response = lastValueFrom(this.http.post<Adverbial[]>(
            this.baseApiUrl + '/upload/pilot_upload/', filepath));

        try {
            return await response;
        } catch (error) {
            if (error instanceof HttpErrorResponse) {
                throw new ValidationErrors(error.error);
            }
            throw error;
        }
    }

    async uploadQuestionnaire(filepath: string): Promise<Adverbial[]> {

        // Make http post request over api
        const response = lastValueFrom(this.http.post<Adverbial[]>(
            this.baseApiUrl + '/upload/questionnaire_upload/', filepath));

        try {
            return await response;
        } catch (error) {
            if (error instanceof HttpErrorResponse) {
                throw new ValidationErrors(error.error);
            }
            throw error;
        }
    }
}
