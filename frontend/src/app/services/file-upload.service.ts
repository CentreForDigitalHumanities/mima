import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
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
        const response = this.http.post<Adverbial[]>(
            this.baseApiUrl + '/upload/upload/', formData).toPromise();

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
