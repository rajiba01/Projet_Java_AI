import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environnments/environment';
import { map } from 'rxjs';
export type CreateAnnonceUploadPayload = {
  type: string;
  titre: string;
  description?: string;
  prixVente: number;
  qtyOnHand?: number;
  file: File;
};

export type FournisseurAnnonce = {
  id: number;
  userId: number;
  produitId: number;
  titre: string;
  description?: string;
  qualiteScore?: number | null;
  qualiteVerdict?: string | null;
  imageUrl?: string | null;
  prixVente: number;
  active: number;
  createdAt?: string;

  // NEW (si backend le renvoie)
  qtyOnHand?: number | null;
};

export type FournisseurAnnonceRequest = {
  produitId: number;
  titre: string;
  description?: string;
  qualiteScore?: number | null;
  qualiteVerdict?: 'HAUTE' | 'MOYENNE' | 'FAIBLE' | string | null;
  imageUrl?: string | null;
  prixVente: number;
};

export type StockAdjustRequest = {
  produitId: number;
  deltaQty: number;
};

@Injectable({ providedIn: 'root' })
export class FournisseurApiService {
  private base = environment.apiBase;
  private origin = new URL(environment.apiBase).origin;

  constructor(private http: HttpClient) {}

  private absolutizeImageUrl(url?: string | null): string | null {
    if (!url) return null;
    const u = url.trim();
    if (!u) return null;
    if (/^https?:\/\//i.test(u)) return u;
    // backend serves uploads on http://localhost:8080/uploads/...
    const path = u.startsWith('/') ? u : `/${u}`;
    return `${this.origin}${path}`;
  }

  getMesAnnonces() {
    // Backend endpoint exists but requires auth (401 if token missing)
    return this.http.get<any>(`${this.base}/fournisseur/annonces`).pipe(
      map((res) => {
        // try the most common shapes
        if (Array.isArray(res)) {
          return (res as FournisseurAnnonce[]).map((a) => ({
            ...a,
            imageUrl: this.absolutizeImageUrl(a.imageUrl)
          }));
        }
        const maybe =
          res?.annonces ??
          res?.content ??
          res?.data ??
          res?.items ??
          res?.result;
        const arr = (Array.isArray(maybe) ? maybe : []) as FournisseurAnnonce[];
        return arr.map((a) => ({
          ...a,
          imageUrl: this.absolutizeImageUrl(a.imageUrl)
        }));
      })
    );
  }

  publierAnnonce(body: FournisseurAnnonceRequest) {
    // Backend POST endpoint is singular
    return this.http.post<{ annonceId: number }>(`${this.base}/fournisseur/annonce`, body);
  }

  adjustStock(body: StockAdjustRequest) {
    return this.http.post<{ status: string }>(`${this.base}/fournisseur/stock/adjust`, body);
  }
    publierAnnonceAvecImage(payload: CreateAnnonceUploadPayload) {
    const form = new FormData();
    form.append('type', payload.type);
    form.append('titre', payload.titre);
    form.append('description', payload.description ?? '');
    form.append('prixVente', String(payload.prixVente));
    if (payload.qtyOnHand != null) form.append('qtyOnHand', String(payload.qtyOnHand));
    form.append('file', payload.file);

    // URL backend: /fournisseur/annonce/upload
    return this.http.post<{ annonceId: number; imageUrl: string }>(
      `${this.base}/fournisseur/annonce/upload`,
      form
    ).pipe(
      map((res) => ({
        ...res,
        imageUrl: this.absolutizeImageUrl(res?.imageUrl) ?? ''
      }))
    );
  }


}