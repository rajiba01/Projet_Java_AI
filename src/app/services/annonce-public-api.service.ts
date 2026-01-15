import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environnments/environment';
import { map } from 'rxjs/operators';

export type PublicAnnonce = {
  id: number;
  produitId: number;
  /**
   * Type produit (ex: PECHE, DATTE, HUILE...).
   * Optionnel car certains endpoints ne le renvoient pas.
   */
  produitType?: string | null;
  titre: string;
  description?: string | null;
  prixVente: number;
  qualiteScore?: number | null;
  qualiteVerdict?: string | null;
  imageUrl?: string | null;
  qtyOnHand?: number | null;
};

@Injectable({ providedIn: 'root' })
export class AnnoncePublicApiService {
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

  list(params?: { produitId?: number; q?: string; minPrix?: number; maxPrix?: number; qualiteVerdict?: string }) {
    let httpParams = new HttpParams();
    if (params?.produitId != null) httpParams = httpParams.set('produitId', String(params.produitId));
    if (params?.q) httpParams = httpParams.set('q', params.q);
    if (params?.minPrix != null) httpParams = httpParams.set('minPrix', String(params.minPrix));
    if (params?.maxPrix != null) httpParams = httpParams.set('maxPrix', String(params.maxPrix));
    if (params?.qualiteVerdict) httpParams = httpParams.set('qualiteVerdict', params.qualiteVerdict);

    // Certains backends renvoient un tableau direct, d'autres renvoient un objet wrappé.
    // Ici on normalise pour que le composant Home puisse afficher les annonces.
    return this.http.get<any>(`${this.base}/annonces`, { params: httpParams }).pipe(
      map((res) => {
        if (Array.isArray(res)) {
          return (res as PublicAnnonce[]).map((a) => ({
            ...a,
            imageUrl: this.absolutizeImageUrl(a.imageUrl)
          }));
        }
        const candidates = res?.annonces ?? res?.data ?? res?.content ?? res?.items ?? res?.result;
        if (Array.isArray(candidates)) {
          return (candidates as PublicAnnonce[]).map((a) => ({
            ...a,
            imageUrl: this.absolutizeImageUrl(a.imageUrl)
          }));
        }
        return [] as PublicAnnonce[];
      })
    );
  }
}