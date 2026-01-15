import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environnments/environment';

export interface ForecastResult {
  predictedPrice: number;
  note?: string;
  region?: string;
  horizonDays?: number;
  asofDate?: string;
}

interface PythonForecastResponse {
  region: string;
  horizon_days: number;
  asof_date: string;
  predicted_px_moyen: number;
}

export interface RecentStatsResponse {
  region: string;
  window: number;
  count: number;
  last_date: string;
  last_px_moyen: number;
  mean: number;
  min: number;
  max: number;
}
export interface CalibratedResponse {
  region: string;
  horizon_days: number;
  dataset_baseline_mean7: number;
  current_price_input: number;
  model_pred: number;
  calibration_offset: number;
  predicted_calibrated: number;
  pct_vs_current: number;
  advice: 'BUY_NOW' | 'WAIT' | 'NEUTRAL';
  advice_label: string;
  asof_date_model: string;
  asof_date_stats: string;
}

export interface SeriesPoint {
  date: string;     // YYYY-MM-DD
  px_moyen: number;
}

export interface SeriesResponse {
  region: string;
  days: number;
  points: SeriesPoint[];
}

@Injectable({ providedIn: 'root' })
export class ForecastApiService {
  private readonly baseUrl =  environment.forecastUrl;

  constructor(private http: HttpClient) {}

  predict(region: string, horizon: number): Observable<ForecastResult> {
    const params = new HttpParams().set('region', region).set('horizon', horizon);

    return this.http.get<PythonForecastResponse>(`${this.baseUrl}/predict`, { params }).pipe(
      map((r) => ({
        predictedPrice: r.predicted_px_moyen,
        region: r.region,
        horizonDays: r.horizon_days,
        asofDate: r.asof_date,
        note: `Basé sur les données jusqu’au ${r.asof_date} (horizon ${r.horizon_days} jours).`
      }))
    );
  }

  recentStats(region: string, window = 7): Observable<RecentStatsResponse> {
    const params = new HttpParams().set('region', region).set('window', window);
    return this.http.get<RecentStatsResponse>(`${this.baseUrl}/recent_stats`, { params });
  }

  series(region: string, days = 120): Observable<SeriesResponse> {
    const params = new HttpParams().set('region', region).set('days', days);
    return this.http.get<SeriesResponse>(`${this.baseUrl}/series`, { params });
  }
  predictCalibrated(region: string, horizon: number, currentPrice: number, stablePct = 1.0): Observable<CalibratedResponse> {
  const params = new HttpParams()
    .set('region', region)
    .set('horizon', horizon)
    .set('current_price', currentPrice)
    .set('stable_pct', stablePct);

  return this.http.get<CalibratedResponse>(`${this.baseUrl}/predict_calibrated`, { params });
}}