import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environnments/environment';

@Injectable({ providedIn: 'root' })
export class ProduitsTypesService {
  private base = environment.apiUrl;
  constructor(private http: HttpClient) {}

  getTypes() {
    return this.http.get<string[]>(`${this.base}/produits/types`);
  }
}