import { Injectable } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class FournisseurGuard  {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(): boolean {
    if (!this.auth.isLoggedIn()) {
      this.router.navigateByUrl('/login');
      return false;
    }
    if (this.auth.getRole() !== 'FOURNISSEUR') {
      this.router.navigateByUrl('/home');
      return false;
    }
    return true;
  }
}