import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environnments/environment';

export type CreateCommandeRequest = {
  annonceId: number;
  quantite: number;
  email: string;
};

// إذا تحب تستعمل receipt (نفس AchatReceipt اللي يرجع من backend)
export type CommandeReceipt = {
  idAchat: number;        // ولا idCommande حسب DTO متاعك
  idProduit: number;
  typeProduit: string;
  quantite: number;
  prixUnitaire: number;
  total: number;
  dateAchat: string;
};

@Injectable({ providedIn: 'root' })
export class CommandeApiService {
  private base = environment.apiBase;

  constructor(private http: HttpClient) {}

  createCommande(req: CreateCommandeRequest) {
    return this.http.post<CommandeReceipt>(`${this.base}/commandes`, req);
  }
}