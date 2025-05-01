import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface FichePatient {
  id?: number;
  patientId?: number;
  nom: string;
  prenom: string;
  age?: number;
  profession?: string;
  telephone?: string;
  adresse?: string;
  sexe?: string;
  etatGeneral?: string;
  antecedentsChirurgicaux?: string;
  priseMedicaments?: string;
  allergies?: string;
  observationsDentaires?: string;
  createdAt?: Date;
  updatedAt?: Date;
  documentPath?: string | null;
  documentName?: string | null;
  documentType?: string | null;
  documentSize?: number | null;
  documentUploadDate?: Date | null;
}

export interface PatientDocument {
  id: number;
  name: string;
  fileType: string;
  fileSize: number;
  uploadDate: Date;
  url: string;
}

@Injectable({
  providedIn: 'root'
})
export class PatientService {
  private apiUrl = `${environment.apiUrl}/api/v1/api/patients`;

  constructor(private http: HttpClient) {}

  // Get current patient's medical information
  getCurrentPatientFiche(): Observable<FichePatient> {
    return this.http.get<FichePatient>(`${this.apiUrl}/me/fiche`).pipe(
      tap(response => console.log('Received fiche:', response)),
      catchError(error => {
        console.error('Error fetching fiche:', error);
        return throwError(() => error);
      })
    );
  }

  // Update current patient's medical information
  updatePatientFiche(fichePatient: FichePatient): Observable<FichePatient> {
    return this.http.put<FichePatient>(`${this.apiUrl}/me/fiche`, fichePatient).pipe(
      tap(response => console.log('Updated fiche:', response)),
      catchError(error => {
        console.error('Error updating fiche:', error);
        return throwError(() => error);
      })
    );
  }

  // Alias for updatePatientFiche to match the component's usage
  updateFichePatient(fichePatient: FichePatient): Observable<FichePatient> {
    return this.updatePatientFiche(fichePatient);
  }

  // Create new patient fiche from welcome modal
  createPatientFicheFromWelcome(patientData: any, files?: File[]): Observable<any> {
    // First create the patient fiche
    return this.http.post(`${this.apiUrl}/me/fiche`, patientData, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    }).pipe(
      tap(response => console.log('Created fiche:', response)),
      catchError(error => {
        console.error('Error creating fiche:', error);
        return throwError(() => error);
      })
    );
  }

  // Get patient's medical information by ID (for doctors/secretaries)
  getPatientFiche(patientId: number): Observable<FichePatient> {
    return this.http.get<FichePatient>(`${this.apiUrl}/${patientId}/fiche`).pipe(
      tap(response => console.log('Received patient fiche:', response)),
      catchError(error => {
        console.error('Error fetching patient fiche:', error);
        return throwError(() => error);
      })
    );
  }

  // Create or update patient's medical information (for doctors/secretaries)
  createOrUpdateFiche(patientId: number, fichePatient: FichePatient): Observable<FichePatient> {
    return this.http.post<FichePatient>(`${this.apiUrl}/${patientId}/fiche`, fichePatient).pipe(
      tap(response => console.log('Created/Updated patient fiche:', response)),
      catchError(error => {
        console.error('Error creating/updating patient fiche:', error);
        return throwError(() => error);
      })
    );
  }

  // Upload documents
  uploadDocuments(files: FormData): Observable<PatientDocument[]> {
    // Don't extract the file, send the FormData directly
    return this.http.post<FichePatient>(`${this.apiUrl}/me/fiche/document`, files).pipe(
      map(response => [{
        id: response.id || 1,
        name: response.documentName || 'Document',
        fileType: response.documentType || 'application/octet-stream',
        fileSize: response.documentSize || 0,
        uploadDate: new Date(),
        url: `${this.apiUrl}/me/fiche/document`
      }]),
      tap(response => console.log('Uploaded documents:', response)),
      catchError(error => {
        console.error('Error uploading documents:', error);
        return throwError(() => error);
      })
    );
  }

  // Get all documents
  getDocuments(): Observable<PatientDocument[]> {
    return this.getCurrentPatientFiche().pipe(
      map(fiche => {
        if (fiche.documentPath) {
          return [{
            id: fiche.id || 1,
            name: fiche.documentName || 'Document',
            fileType: fiche.documentType || 'application/octet-stream',
            fileSize: fiche.documentSize || 0,
            uploadDate: new Date(),
            url: `${this.apiUrl}/me/fiche/document`
          }];
        }
        return [];
      }),
      tap(response => console.log('Received documents:', response)),
      catchError(error => {
        console.error('Error fetching documents:', error);
        return throwError(() => error);
      })
    );
  }

  // Delete a document
  deleteDocument(documentId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/me/fiche/document`).pipe(
      tap(() => console.log('Deleted document:', documentId)),
      catchError(error => {
        console.error('Error deleting document:', error);
        return throwError(() => error);
      })
    );
  }

  uploadDocument(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.apiUrl}/me/fiche/document`, formData, {
      headers: {
        'Accept': 'application/json'
      }
    }).pipe(
      tap(response => console.log('Uploaded document:', response)),
      catchError(error => {
        console.error('Error uploading document:', error);
        return throwError(() => error);
      })
    );
  }

  getDocument(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/me/fiche/document`, {
      responseType: 'blob',
      headers: {
        'Accept': '*/*'
      }
    }).pipe(
      tap(response => console.log('Received document:', response)),
      catchError(error => {
        console.error('Error fetching document:', error);
        return throwError(() => error);
      })
    );
  }
}