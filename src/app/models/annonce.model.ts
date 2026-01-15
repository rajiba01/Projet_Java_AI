export type Annonce = {
  id: number;
  produitId: number;
  produitType: string;       // "BANANE", "PÊCHE", ...
  titre: string;
  description?: string | null;
  prixVente: number;
  qualiteScore?: number | null;
  qualiteVerdict?: string | null;
  imageUrl?: string | null;
  qtyOnHand?: number | null;
};