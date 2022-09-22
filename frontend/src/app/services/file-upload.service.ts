import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Adverbial } from '../models/adverbial';

@Injectable({
    providedIn: 'root'
})
export class FileUploadService {
    baseApiUrl = '/api';
    constructor(private http: HttpClient) { }

    upload(file: File): Observable<Adverbial[]> {

        // Create form data
        const formData = new FormData();

        // Store form name as "file" with file data
        formData.append('file', file, file.name);

        // Make http post request over api
        // with formData as req
        return this.http.post<Adverbial[]>(this.baseApiUrl + '/upload/upload/', formData);
    }
}
