import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { EconomicService } from '../../services/economic.service';
import { AchatService } from '../../services/achat.service';
import { AuthService } from '../../services/auth.service';

import { AnnoncesPublicService } from '../../services/annonce-public.service';
import { Annonce } from '../../models/annonce.model';
import { Achat } from '../../models/achat.model';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './produit-details.component.html',
  styleUrls: ['./produit-details.component.css']
})
export class ProduitDetailsComponent implements OnInit {
  // route param
  type = '';

  // annonces fournisseurs (ce que tu veux afficher)
  annonces: Annonce[] = [];
  loadingAnnonces = false;
  errorAnnonces = '';

  // annonce sélectionnée (celle qu’on achète / prédit)
  selectedAnnonce: Annonce | null = null;

  quantity = 1;
  totalPrice = 0;

  email = '';
  forecastLoading = false;
  forecastResult: { predictedPrice: number; note?: string } | null = null;

  region = 'sfax';
  horizon = 7;
  buyLoading = false;
  buyResult: Achat | null = null;

  // Modal facture
  invoiceModalOpen = false;
  invoiceEmail = '';
  invoiceSending = false;

  // Achat via modal
  checkoutLoading = false;
  checkoutError: string | null = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private economicService: EconomicService,
    private authService: AuthService,
    private achatService: AchatService,
    private annoncesService: AnnoncesPublicService
  ) {}

  ngOnInit(): void {
    const typeParam = this.route.snapshot.paramMap.get('type');
    this.type = typeParam ? decodeURIComponent(typeParam) : '';

    if (!this.type) {
      this.errorAnnonces = "type manquant dans l'URL";
      return;
    }

    this.loadAnnonces();
  }

  loadAnnonces() {
    this.loadingAnnonces = true;
    this.errorAnnonces = '';

    this.annoncesService.listByType(this.type).subscribe({
      next: (data) => {
        this.annonces = data ?? [];
        this.selectedAnnonce = this.annonces.length ? this.annonces[0] : null;
        this.quantity = 1;
        this.normalizeQuantityAndPrice();
        this.loadingAnnonces = false;
      },
      error: (err) => {
        const msg = err?.error?.message ?? err?.error ?? err?.message;
        this.errorAnnonces = msg || 'Erreur chargement annonces';
        this.loadingAnnonces = false;
      }
    });
  }

  selectAnnonce(a: Annonce) {
    this.selectedAnnonce = a;
    this.quantity = 1;
    this.normalizeQuantityAndPrice();
  }

  onQuantityInputChange() {
    this.normalizeQuantityAndPrice();
  }

  private normalizeQuantityAndPrice() {
    if (!this.selectedAnnonce) {
      this.totalPrice = 0;
      return;
    }

    const maxQty = this.selectedAnnonce.qtyOnHand ?? 0;
    const q = Number.isFinite(this.quantity) ? Math.floor(this.quantity) : 1;
    this.quantity = Math.max(1, Math.min(q, maxQty || 1));
    this.updatePrice();
  }

  incrementQty() {
    if (!this.selectedAnnonce) return;
    const maxQty = this.selectedAnnonce.qtyOnHand ?? 0;
    if (this.quantity < (maxQty || 1)) {
      this.quantity++;
      this.updatePrice();
    }
  }

  decrementQty() {
    if (!this.selectedAnnonce) return;
    if (this.quantity > 1) {
      this.quantity--;
      this.updatePrice();
    }
  }

  updatePrice() {
    if (!this.selectedAnnonce) {
      this.totalPrice = 0;
      return;
    }
    this.totalPrice = this.quantity * Number(this.selectedAnnonce.prixVente);
  }

  buy() {
    if (!this.selectedAnnonce) return;

    const email = this.authService.getEmail() ?? this.email;
    this.invoiceEmail = email || '';
    this.checkoutError = null;
    this.invoiceModalOpen = true;
  }

  confirmPurchase() {
    if (!this.selectedAnnonce) return;

    const email = (this.invoiceEmail || '').trim();
    if (!email) {
      this.checkoutError = 'Veuillez saisir un email valide.';
      return;
    }

    this.checkoutLoading = true;
    this.checkoutError = null;
    this.buyResult = null;

    // IMPORTANT: on achète par produitId (selon ton API existante)
    this.achatService.createAchat({
      idProduit: this.selectedAnnonce.produitId,
      quantite: this.quantity,
      email
    }).subscribe({
      next: (receipt) => {
        this.buyResult = receipt;
        this.sendInvoiceEmail();
      },
      error: () => {
        this.checkoutError = "Erreur lors de l'achat (API).";
        this.checkoutLoading = false;
      },
      complete: () => {
        this.checkoutLoading = false;
      }
    });
  }

  closeInvoiceModal() {
    this.invoiceModalOpen = false;
  }

  sendInvoiceEmail() {
    if (!this.selectedAnnonce) return;

    const to = (this.invoiceEmail || '').replace(/[\s\r\n]+/g, '').trim();
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to);
    if (!isEmail) {
      alert('Veuillez saisir un email valide.');
      return;
    }

    const subject = `Facture - ${this.selectedAnnonce.produitType}`;
    const unit = Number(this.selectedAnnonce.prixVente);

    const body =
      `Bonjour,\n\n` +
      `Voici votre facture :\n` +
      `Produit: ${this.selectedAnnonce.produitType}\n` +
      `Annonce: ${this.selectedAnnonce.titre}\n` +
      `Quantité: ${this.quantity}\n` +
      `Prix unitaire: ${unit} TND\n` +
      `Total: ${this.totalPrice.toFixed(2)} TND\n\n` +
      `Merci pour votre achat.`;

    const params = new URLSearchParams({ subject, body });
    window.location.href = `mailto:${to}?${params.toString()}`;
    this.invoiceModalOpen = false;
  }

  goToDashboard(): void {
    this.router.navigate(['/forecast-dashboard'], {
      queryParams: { region: this.region, horizon: this.horizon }
    });
  }

  async forecast() {
    if (!this.selectedAnnonce) return;
    this.forecastLoading = true;
    this.forecastResult = null;

    try {
      // Ici il faut que ton endpoint forecast accepte un produit dynamique.
      // On passe juste produitId/type + quantity (selon ton EconomicService).
      const result = await this.economicService.forecastPrice({
        produit: {
          idProduit: this.selectedAnnonce.produitId,
          typeProduit: this.selectedAnnonce.produitType,
          quantity: this.selectedAnnonce.qtyOnHand ?? 0,
          prix: Number(this.selectedAnnonce.prixVente)
        },
        quantity: this.quantity
      });

      this.forecastResult = result;
    } catch {
      alert('Prévision IA indisponible pour le moment.');
    } finally {
      this.forecastLoading = false;
    }
  }
}