import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environnments/environment';
import { map } from 'rxjs/operators';

export type AnnonceView = {
  id: number;
  produitId: number;
  titre: string;
  prixVente: number;
  qualiteScore?: number | null;
  qualiteVerdict?: string | null;
  imageUrl?: string | null;
  qtyOnHand?: number | null;
  // optionnel
  nomProduit?: string | null;
};

@Injectable({ providedIn: 'root' })
export class AnnonceByTypeService {
  private base = environment.apiBase;
  private origin = new URL(environment.apiBase).origin;

  constructor(private http: HttpClient) {}

  private absolutizeImageUrl(url?: string | null): string | null {
    if (!url) return null;
    const u = url.trim();
    if (!u) return null;
    if (/^https?:\/\//i.test(u)) return u;
    const path = u.startsWith('/') ? u : `/${u}`;
    return `${this.origin}${path}`;
  }

  listByType(type: string) {
    const params = new HttpParams().set('type', type);
    return this.http.get<AnnonceView[]>(`${this.base}/annonces/by-type`, { params }).pipe(
      map((arr) =>
        (arr ?? []).map((a) => ({
          ...a,
          imageUrl: this.absolutizeImageUrl(a.imageUrl)
        }))
      )
    );
  }
}