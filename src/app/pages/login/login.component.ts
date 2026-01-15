import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from "@angular/router";
import { Router } from '@angular/router';
import { AuthService as AppAuthService } from '../../services/auth.service';
import { Auth } from '../../models/auth.model';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  imports: [CommonModule, RouterLink, FormsModule]
})
export class LoginComponent implements OnInit {

  log: Auth = { email: '', mdp: '' };
  loading = false;
  errorMsg = '';

  constructor(private authService: AppAuthService, private router: Router) {}

  ngOnInit() {
    const images = document.querySelectorAll('.carousel-image');
    let current = 0;

    // If the template doesn't have carousel images (or renders later), avoid crashing.
    if (!images || images.length === 0) {
      return;
    }

    setInterval(() => {
      images[current]?.classList?.remove('active');
      current = (current + 1) % images.length;
      images[current]?.classList?.add('active');
    }, 3000); // changement toutes les 3 secondes
  }

 onSubmit() {
    this.errorMsg = '';
    this.loading = true;
    this.authService.login(this.log).subscribe({
      next: (res: string) => {
        console.log('Connexion réussie:', res);
        alert('Connexion réussie');

        this.loading = false;

        // Après login on a stocké le token => on peut lire le role depuis le JWT
        const role = this.authService.getRole();
        if (role === 'FOURNISSEUR') {
          this.router.navigate(['/home-fournisseur'], { queryParams: { email: this.log.email } });
        } else {
          this.router.navigate(['/home'], { queryParams: { email: this.log.email } });
        }
      },
      error: (err: unknown) => {
        console.error('Erreur login:', err);
        this.loading = false;
        this.authService.logout();
        this.errorMsg = 'Email ou mot de passe invalide.';
      }
    });
  }

}
