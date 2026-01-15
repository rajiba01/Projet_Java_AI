import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environnments/environment';
import { Annonce } from '../models/annonce.model';

@Injectable({ providedIn: 'root' })
export class AnnoncesPublicService {
  private base = environment.apiBase;

  constructor(private http: HttpClient) {}

  listByType(type: string) {
    const params = new HttpParams().set('type', type);
    return this.http.get<Annonce[]>(`${this.base}/annonces/by-type`, { params });
  }
}