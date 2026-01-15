import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environnments/environment'; // keep same path as your project
import { Observable, of } from 'rxjs';
import { catchError, delay } from 'rxjs/operators';

/**
 * VirtualizeService
 * - primary: calls backend POST ${environment.apiUrl}/virtualize
 * - fallback: runs a client-side mock simulation if backend unreachable (useful for dev)
 *
 * Payload expected by backend (example):
 * {
 *   product_id: string | number, // we send type string by default (e.g. "Tomato") — change to numeric id if backend expects numeric
 *   area_ha: number,
 *   days: number,
 *   budget: number
 * }
 *
 * Response shape expected: (see server contract in chat) — this service doesn't enforce strict typing to remain flexible
 */
@Injectable({ providedIn: 'root' })
export class VirtualizeService {
  private base = environment.apiUrl; // e.g. http://localhost:8080/api

  constructor(private http: HttpClient) {}

  virtualize(payload: any): Observable<any> {
    const url = `${this.base}/virtualize`;
    return this.http.post<any>(url, payload).pipe(
      catchError(err => {
        console.warn('Virtualize HTTP failed, using local mock simulation', err);
        // fallback to mock (simulate a short latency)
        return this.mockVirtualize(payload).pipe(delay(600));
      })
    );
  }

  /**
   * Local mock simulation (basic deterministic algorithm).
   * Replace or extend if you want more complex client-side behavior.
   */
  mockVirtualize(payload: any): Observable<any> {
    const prod = (payload.product_id || 'Tomato').toString().toLowerCase();
    const area = Number(payload.area_ha || 1.0);
    const days = Number(payload.days || 30);
    const budget = Number(payload.budget || 0);

    const profiles: any = {
      olive: { base_days: 365, water_mm: 2, seed_cost_per_ha: 300, labor_hours_per_ha: 40, base_yield_per_ha: 2000 },
      tomato: { base_days: 120, water_mm: 6, seed_cost_per_ha: 800, labor_hours_per_ha: 120, base_yield_per_ha: 10000 },
      banana: { base_days: 540, water_mm: 8, seed_cost_per_ha: 1200, labor_hours_per_ha: 200, base_yield_per_ha: 8000 }
    };

    const profile = profiles[prod] || profiles['tomato'];
    const avgRain = 2.0; // mock
    const rainRatio = Math.min(2.0, avgRain / profile.water_mm);
    const yieldFactor = 0.6 + 0.4 * rainRatio;
    const growthPercent = Math.round(Math.max(5, Math.min(100, 50 * yieldFactor + 10)));
    const daysToMaturity = Math.max(1, Math.round(profile.base_days * (100 / growthPercent)));
    const expectedYield = profile.base_yield_per_ha * area * yieldFactor;

    const requiredWorkHours = profile.labor_hours_per_ha * area;
    const workersNeeded = Math.max(1, Math.ceil(requiredWorkHours / (8 * Math.min(days, 30))));

    const seedCost = profile.seed_cost_per_ha * area;
    const fertilizer = 200 * area;
    const extraWaterMm = Math.max(0, (profile.water_mm * days) - (avgRain * days));
    const irrigationCost = extraWaterMm * 0.5 * area;
    const laborCost = requiredWorkHours * 5.0;
    const total = +(seedCost + fertilizer + irrigationCost + laborCost).toFixed(2);

    const budgetOk = budget >= total;
    const suggestions = budgetOk ? [] : ['increase_budget', 'reduce_area', 'choose_drought_resistant_variety'];

    const timeline = Array.from({ length: days }, (_, i) => {
      const g = +(((i + 1) * (growthPercent / days)).toFixed(1));
      const note = avgRain < profile.water_mm ? 'low rain' : 'ok';
      return { day: i + 1, growth: g, note };
    });

    const resp = {
      product_id: payload.product_id,
      growth_percent: growthPercent,
      days_to_maturity: daysToMaturity,
      expected_yield_kg: +expectedYield.toFixed(1),
      yield_unit: 'kg',
      success_probability: +(yieldFactor * 0.9).toFixed(2),
      workers_needed: workersNeeded,
      required_work_hours: +requiredWorkHours.toFixed(1),
      budget_breakdown: {
        seed_cost: +seedCost.toFixed(2),
        fertilizer: +fertilizer.toFixed(2),
        irrigation: +irrigationCost.toFixed(2),
        labor: +laborCost.toFixed(2),
        total: total
      },
      budget_ok: budgetOk,
      suggestions,
      timeline,
      visual: { type: 'grid', value: growthPercent }
    };

    return of(resp);
  }
}