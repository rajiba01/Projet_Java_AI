import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environnments/environment';

export type CreateAnnonceUploadPayload = {
  type: string;          // "BANANE", "HUILE", ...
  titre: string;
  description?: string;
  prixVente: number;
  qtyOnHand?: number;
  file: File;
};

@Injectable({ providedIn: 'root' })
export class FournisseurAnnonceUploadService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  createAnnonceWithImage(payload: CreateAnnonceUploadPayload) {
    const form = new FormData();
    form.append('type', payload.type);
    form.append('titre', payload.titre);
    form.append('description', payload.description ?? '');
    form.append('prixVente', String(payload.prixVente));
    if (payload.qtyOnHand != null) form.append('qtyOnHand', String(payload.qtyOnHand));
    form.append('file', payload.file);

    // IMPORTANT: l’URL doit matcher ton controller:
    // @Path("/fournisseur") + @POST @Path("/annonce/upload")
    return this.http.post<{ annonceId: number; imageUrl: string }>(
      `${this.base}/fournisseur/annonce/upload`,
      form
    );
  }
}