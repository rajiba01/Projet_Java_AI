import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FournisseurApiService, FournisseurAnnonce } from '../../services/fournisseur-api.service';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-home-fournisseur',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './home-fournisseur.component.html',
  styleUrls: ['./home-fournisseur.component.css']
})
export class HomeFournisseurComponent implements OnInit {
  annonces: FournisseurAnnonce[] = [];
  loading = false;

  // idéal: charger depuis API /produits/types
  types: string[] = ['BANANE', 'PÊCHE', 'DATTE', 'HUILE'];
  selectedType = '';

  error = '';   // publication annonce
  error2 = '';  // stock
  info = '';

  deltaByAnnonceId: Record<number, number> = {};

  // Form fournisseur (upload + champs optionnels)
  form = {
    type: '',
    produitId: 0,
    titre: '',
    description: '',
    qualiteScore: null as number | null,
    qualiteVerdict: '' as string,
    prixVente: 0,
    qtyOnHand: null as number | null
  };

  selectedFile: File | null = null;

  constructor(private api: FournisseurApiService, private router: Router) {}

  ngOnInit(): void {
    this.load();
  }
  virtualize() {
  this.router.navigate(['/virtualize']);
}
Commandes() {
  this.router.navigate(['/fournisseur-commandes']);
}
  load() {
    this.error2 = '';
    this.info = '';
    this.loading = true;

    this.api.getMesAnnonces().subscribe({
      next: (data) => {
        this.annonces = data;
        for (const a of data) {
          if (this.deltaByAnnonceId[a.id] == null) this.deltaByAnnonceId[a.id] = 1;
        }
        this.loading = false;
      },
      error: (err) => {
        const msg = err?.error?.message ?? err?.error ?? err?.message;
        const status = err?.status ? `HTTP ${err.status}` : '';
        if (err?.status === 401 || err?.status === 403) {
          this.error2 = 'Accès refusé (auth requise). Connectez-vous avec un compte FOURNISSEUR puis réessayez.';
        } else {
          this.error2 = [status, msg].filter(Boolean).join(' - ') || 'Erreur chargement annonces';
        }
        this.loading = false;
      }
    });
  }

  onTypeChange(type: string) {
    this.selectedType = type;
    this.form.type = type;
  }

  onFileSelected(e: Event) {
    const input = e.target as HTMLInputElement;
    this.selectedFile = input.files && input.files.length ? input.files[0] : null;
  }

  publier() {
    this.error = '';

    if (!this.form.type) {
      this.error = 'Type obligatoire';
      return;
    }
    if (!this.form.titre?.trim()) {
      this.error = 'Titre obligatoire';
      return;
    }
    if (!this.form.prixVente || this.form.prixVente <= 0) {
      this.error = 'Prix de vente invalide';
      return;
    }
    if (!this.selectedFile) {
      this.error = 'Image obligatoire';
      return;
    }

    this.loading = true;

    this.api.publierAnnonceAvecImage({
      type: this.form.type,
      titre: this.form.titre.trim(),
      description: this.form.description?.trim(),
      prixVente: this.form.prixVente,
      qtyOnHand: this.form.qtyOnHand ?? undefined,
      file: this.selectedFile
    }).subscribe({
      next: () => {
        this.loading = false;
        // reset
        this.form = {
          type: '',
          produitId: 0,
          titre: '',
          description: '',
          qualiteScore: null,
          qualiteVerdict: '',
          prixVente: 0,
          qtyOnHand: null
        };
        this.selectedType = '';
        this.selectedFile = null;
        this.load();
      },
      error: (err) => {
        const msg = err?.error?.message ?? err?.error ?? err?.message;
        const status = err?.status ? `HTTP ${err.status}` : '';
        this.error = [status, msg].filter(Boolean).join(' - ') || 'Erreur publication';
        this.loading = false;
      }
    });
  }

  private getDelta(a: FournisseurAnnonce): number {
    const v = this.deltaByAnnonceId[a.id];
    const n = Number(v);
    if (!Number.isFinite(n) || n <= 0) return 1;
    return Math.floor(n);
  }

  addStock(a: FournisseurAnnonce) {
    this.adjustStock(a, +this.getDelta(a));
  }

  removeStock(a: FournisseurAnnonce) {
    this.adjustStock(a, -this.getDelta(a));
  }

  private adjustStock(a: FournisseurAnnonce, deltaQty: number) {
    this.error2 = '';
    this.info = '';
    this.loading = true;

    this.api.adjustStock({ produitId: a.produitId, deltaQty }).subscribe({
      next: () => {
        this.loading = false;
        this.info = `Stock mis à jour (produit ${a.produitId}, delta ${deltaQty}).`;
        this.load();
      },
      error: (err) => {
        const msg = err?.error?.message ?? err?.error ?? err?.message;
        const status = err?.status ? `HTTP ${err.status}` : '';
        this.error2 = [status, msg].filter(Boolean).join(' - ') || 'Erreur mise à jour stock';
        this.loading = false;
      }
    });
  }
}