import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { ForecastApiService, CalibratedResponse, RecentStatsResponse, SeriesResponse } from '../../services/forecast-api.service';

import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, Filler);

@Component({
  selector: 'app-forecast-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './forecast-dashboard.component.html',
  styleUrls: ['./forecast-dashboard.component.css']
})
export class ForecastDashboardComponent implements OnDestroy {
  region = 'sfax';
  horizon = 7;

  // client input
  currentPrice: number | null = 11.8;
  stablePct = 1.0;

  loading = false;
  errorMsg: string | null = null;

  calibrated: CalibratedResponse | null = null;
  stats: RecentStatsResponse | null = null;
  series: SeriesResponse | null = null;

  private chart: Chart | null = null;

  @ViewChild('priceChart') private priceChartRef?: ElementRef<HTMLCanvasElement>;

  constructor(private api: ForecastApiService) {}

  ngOnDestroy(): void {
    this.chart?.destroy();
    this.chart = null;
  }

  analyze(): void {
    this.errorMsg = null;
    this.calibrated = null;

    if (this.currentPrice == null || this.currentPrice <= 0) {
      this.errorMsg = 'Veuillez saisir un prix actuel valide (DT/L).';
      return;
    }

    this.loading = true;

    forkJoin({
      calibrated: this.api.predictCalibrated(this.region, this.horizon, this.currentPrice, this.stablePct),
      stats: this.api.recentStats(this.region, 7),
      series: this.api.series(this.region, 180)
    }).subscribe({
      next: ({ calibrated, stats, series }) => {
        this.calibrated = calibrated;
        this.stats = stats;
        this.series = series;

        // Important: le canvas est derrière un *ngIf => il n'existe pas encore
        // au moment exact du callback. On attend le prochain tick.
        setTimeout(() => this.renderChart(series, stats.mean, calibrated.predicted_calibrated));
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err?.error?.detail ?? 'Erreur lors du calcul.';
      }
    });
  }

  adviceClass(): string {
    const a = this.calibrated?.advice;
    if (a === 'BUY_NOW') return 'buy';
    if (a === 'WAIT') return 'wait';
    return 'neutral';
  }

  private renderChart(seriesResp: SeriesResponse, mean7: number, predictedCalibrated: number): void {
    if (!seriesResp?.points?.length) {
      this.errorMsg = 'Aucune donnée de série pour afficher la courbe.';
      return;
    }

    const labels = seriesResp.points.map(p => p.date);
    const data = seriesResp.points.map(p => p.px_moyen);

    // mean7 as a flat line
    const meanLine = data.map(() => mean7);

    // predicted point at the last x position
    const predPoint = data.map(() => null as any);
    predPoint[predPoint.length - 1] = predictedCalibrated;

    // recreate chart
    this.chart?.destroy();
    this.chart = null;

    const canvas = this.priceChartRef?.nativeElement;
    if (!canvas) {
      // Si ce message apparaît, c'est que le template n'a pas encore rendu le canvas.
      // Le setTimeout ci-dessus doit normalement empêcher ça.
      return;
    }

    this.chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Historique (px_moyen)',
            data,
            borderColor: '#2563eb',
            backgroundColor: 'rgba(37,99,235,0.12)',
            fill: true,
            tension: 0.35,
            pointRadius: 1.5
          },
          {
            label: 'Moyenne 7 points',
            data: meanLine,
            borderColor: '#111827',
            borderDash: [6, 6],
            fill: false,
            tension: 0,
            pointRadius: 0
          },
          {
            label: `Prévision calibrée t+${this.horizon}`,
            data: predPoint,
            borderColor: '#16a34a',
            backgroundColor: '#16a34a',
            fill: false,
            showLine: false,
            pointRadius: 6,
            pointHoverRadius: 7
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true },
          tooltip: { mode: 'index', intersect: false }
        },
        scales: {
          y: { ticks: { callback: (v) => `${v}` } }
        }
      }
    });
  }
}