import { Injectable } from '@angular/core';
import { Produit } from '../models/produit.model';

export interface ForecastPriceRequest {
  produit: Produit;
  quantity: number;
}

export interface ForecastPriceResponse {
  predictedPrice: number;
  note?: string;
}

@Injectable({
  providedIn: 'root'
})
export class EconomicService {

  constructor() { }

  /**
   * Stub de prévision IA.
   *
   * À remplacer par un appel HTTP vers un vrai modèle (backend / API).
   */
  async forecastPrice(req: ForecastPriceRequest): Promise<ForecastPriceResponse> {
    const qty = Math.max(1, Math.floor(req.quantity || 1));
    const base = qty * (req.produit?.prix ?? 0);

    // Petit facteur dynamique (ex: +2% si quantité élevée)
    const multiplier = qty >= 50 ? 1.02 : qty >= 10 ? 1.01 : 1;

    // Simule une latence réseau/modèle
    await new Promise(resolve => setTimeout(resolve, 600));

    return {
      predictedPrice: Number((base * multiplier).toFixed(2)),
      note: multiplier === 1 ? 'Prévision basée sur le prix actuel.' : 'Prévision incluant une variation liée au volume.'
    };
  }
}
