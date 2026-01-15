import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environnments/environment';

export type CommandeView = {
  idCommande: number;
  annonceId: number;
  produitId: number;
  typeProduit: string;
  clientEmail: string;
  qty: number;
  prixUnitaire: number;
  total: number;
  status: 'PENDING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  createdAt?: string;
};

@Injectable({ providedIn: 'root' })
export class FournisseurCommandesApiService {
  private base = environment.apiBase;
  constructor(private http: HttpClient) {}

  listMesCommandes() {
    return this.http.get<CommandeView[]>(`${this.base}/fournisseur/commandes`);
  }

  shipCommande(idCommande: number) {
    return this.http.post(`${this.base}/fournisseur/commandes/${idCommande}/ship`, {});
  }

  deliverCommande(idCommande: number, otp: string) {
    return this.http.post(`${this.base}/fournisseur/commandes/${idCommande}/deliver`, { otp });
  }
}