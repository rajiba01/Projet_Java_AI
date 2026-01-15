
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FournisseurCommandesApiService, CommandeView } from '../../services/Fournisseur-comande_api.service';

@Component({
  selector: 'app-fournisseur-commandes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './fournisseur-commandes.component.html',
  styleUrls: ['./fournisseur-commandes.component.css']
})
export class FournisseurCommandesComponent implements OnInit {
  commandes: CommandeView[] = [];
  loading = false;
  error = '';
  info = '';

  otpByCommandeId: Record<number, string> = {};
  loadingAction: Record<number, boolean> = {};

  constructor(private api: FournisseurCommandesApiService) {}

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.loading = true;
    this.error = '';
    this.info = '';
    this.api.listMesCommandes().subscribe({
      next: (data) => {
        this.commandes = data ?? [];
        this.loading = false;
      },
      error: (err) => {
        const msg = err?.error?.message ?? err?.error ?? err?.message;
        this.error = msg || 'Erreur chargement commandes';
        this.loading = false;
      }
    });
  }

  ship(c: CommandeView) {
    this.loadingAction[c.idCommande] = true;
    this.error = '';
    this.info = '';
    this.api.shipCommande(c.idCommande).subscribe({
      next: () => {
        this.info = `Commande #${c.idCommande} expédiée. OTP envoyé au client par email.`;
        this.loadingAction[c.idCommande] = false;
        this.load();
      },
      error: (err) => {
        const msg = err?.error?.message ?? err?.error ?? err?.message;
        this.error = msg || 'Erreur ship';
        this.loadingAction[c.idCommande] = false;
      }
    });
  }

  deliver(c: CommandeView) {
    const otp = (this.otpByCommandeId[c.idCommande] || '').trim();
    if (!otp) { this.error = 'OTP obligatoire'; return; }

    this.loadingAction[c.idCommande] = true;
    this.error = '';
    this.info = '';

    this.api.deliverCommande(c.idCommande, otp).subscribe({
      next: () => {
        this.info = `Commande #${c.idCommande} livrée (DELIVERED).`;
        this.loadingAction[c.idCommande] = false;
        this.load();
      },
      error: (err) => {
        const msg = err?.error?.message ?? err?.error ?? err?.message;
        this.error = msg || 'Erreur deliver';
        this.loadingAction[c.idCommande] = false;
      }
    });
  }
}