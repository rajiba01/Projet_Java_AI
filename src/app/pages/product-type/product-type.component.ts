import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AnnonceByTypeService, AnnonceView } from '../../services/annonce-by-type.service';
import { CommandeApiService } from '../../services/commande-api.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-product-type',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-type.component.html',
  styleUrls: ['./product-type.component.css','../home/home.component.css']
})
export class ProductTypeComponent implements OnInit {
  type = '';
  label = '';
  annonces: AnnonceView[] = [];
  loading = false;
  error = '';

  // modal achat
  buyOpen = false;
  selectedAnnonce: AnnonceView | null = null;
  invoiceEmail = '';
  quantity = 1;
  total = 0;

  buyLoading = false;
  buyError = '';

  constructor(
    private route: ActivatedRoute,
    private api: AnnonceByTypeService,
    private commandeApi: CommandeApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(p => {
      const raw = p.get('type') || '';
      this.type = this.normalizeType(raw);
      this.label = this.toLabel(this.type);
      this.load();
    });
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.api.listByType(this.type).subscribe({
      next: (data) => { this.annonces = data ?? []; this.loading = false; },
      error: (err: HttpErrorResponse) => {
        const msg = (err as any)?.error?.message ?? (err as any)?.error ?? err?.message;
        this.error = msg || 'Erreur chargement annonces';
        this.loading = false;
      }
    });
  }

  annonceImage(a: AnnonceView): string {
    return a.imageUrl && a.imageUrl.trim().length > 0 ? a.imageUrl : 'assets/agricole.jpg';
  }

  openBuy(a: AnnonceView) {
    this.selectedAnnonce = a;
    this.buyOpen = true;
    this.buyError = '';
    this.buyLoading = false;
    this.quantity = 1;
    this.recalcTotal();
  }

  closeBuy() {
    this.buyOpen = false;
    this.selectedAnnonce = null;
  }

  recalcTotal() {
    const price = Number(this.selectedAnnonce?.prixVente ?? 0);
    const q = Number(this.quantity ?? 0);
    this.total = (Number.isFinite(price) && Number.isFinite(q)) ? price * q : 0;
  }

  confirmBuy() {
    this.buyError = '';
    if (!this.selectedAnnonce) return;

    const email = (this.invoiceEmail || '').trim();
    if (!email) { this.buyError = 'Email obligatoire.'; return; }

    const q = Math.floor(Number(this.quantity));
    if (!Number.isFinite(q) || q <= 0) { this.buyError = 'Quantité invalide.'; return; }

    const stock = this.selectedAnnonce.qtyOnHand;
    if (stock != null && q > stock) { this.buyError = 'Quantité dépasse le stock.'; return; }

    this.buyLoading = true;

    this.commandeApi.createCommande({
      annonceId: this.selectedAnnonce.id,
      quantite: q,
      email
    }).subscribe({
      next: () => {
        this.buyLoading = false;
        this.closeBuy();
        // refresh annonces (to update stock)
        this.load();
      },
      error: (err: HttpErrorResponse) => {
        const msg = (err as any)?.error?.message ?? (err as any)?.error ?? err?.message;
        this.buyError = msg || "Erreur lors de l'achat.";
        this.buyLoading = false;
      }
    });
  }

  openPrevision() {
    // TODO: brancher vers ta page/modale de prévision
    // Exemple navigation (adapter la route si besoin)
    this.router.navigate(['/forecast-dashboard'], { queryParams: { type: this.type } });
  }

  private toLabel(type: string): string {
    if (type === 'PÊCHE' || type === 'PECHE') return 'Pêches';
    if (type === 'HUILE') return "Huile d'olive";
    if (type === 'DATTE') return 'Dattes';
    if (type === 'BANANE') return 'Bananes';
    return type;
  }

  private normalizeType(type: string): string {
    const t = decodeURIComponent(type).trim().toUpperCase();
    if (t === 'PECHES' || t === 'PÊCHES') return 'PECHE';
    if (t === 'BANANES' || t === 'BANNANES') return 'BANANE';
    if (t === 'DATTES') return 'DATTE';
    return t;
  }
}