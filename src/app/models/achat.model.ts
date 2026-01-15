export interface Achat {
  idAchat?: number;          // correspond à ID_ACHAT
  idProduit: number;         // correspond à ID_PRODUIT
  quantite: number;          // QUANTITE
  prixUnitaire?: number;     // PRIX_UNITAIRE (souvent calculé côté backend)
  total?: number;            // TOTAL (souvent calculé côté backend)
  dateAchat?: string; 
   typeProduit?: string;       // DATE_ACHAT (ISO string)
}