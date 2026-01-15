import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Achat } from '../models/achat.model';
import { AchatRequest } from '../models/achatrequest.model';
import { environment } from '../../environnments/environment';

@Injectable({ providedIn: 'root' })
export class AchatService {
  private readonly API_URL = `${environment.apiBase}/achat`;

  constructor(private http: HttpClient) {}

  createAchat(payload: AchatRequest): Observable<Achat> {
    // Maintenant on attend un JSON (AchatReceipt/Achat)
    return this.http.post<Achat>(this.API_URL, payload);
  }
}