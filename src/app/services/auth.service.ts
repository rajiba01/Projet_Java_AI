import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Auth } from '../models/auth.model';
import { environment } from '../../environnments/environment';

type JwtPayload = { sub?: string; role?: string; exp?: number };

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'token';
  private readonly EMAIL_KEY = 'email';
  private readonly API_URL = `${environment.apiBase}/auth`;

  constructor(private http: HttpClient) {}

  /**
   * Login backend: retourne un token JWT (string) ou un objet {token: string}.
   * On stocke systématiquement le token dans localStorage.
   */
  login(credentials: Auth): Observable<string> {
    return this.http.post<any>(`${this.API_URL}/login`, credentials).pipe(
      map((res) => {
        const token = typeof res === 'string' ? res : (res?.token ?? res?.accessToken ?? res?.jwt);
        if (!token || typeof token !== 'string') {
          throw new Error('Token manquant dans la réponse login');
        }
        this.setToken(token);
        return token;
      })
    );
  }

  setToken(token: string) {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.EMAIL_KEY);
  }

  /**
   * Fallback email storage (utile si le backend ne met pas le mail dans le JWT,
   * ou si on veut forcer l'email depuis query params).
   */
  setUser(user: { email: string }) {
    if (user?.email) {
      localStorage.setItem(this.EMAIL_KEY, user.email);
    }
  }

  getRole(): string | null {
    const p = this.getPayload();
    return p?.role ?? null;
  }

  getEmail(): string | null {
    const p = this.getPayload();
    return p?.sub ?? localStorage.getItem(this.EMAIL_KEY);
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;
    const p = this.getPayload();
    if (!p?.exp) return true; // si pas exp, on suppose ok
    return Date.now() < p.exp * 1000;
  }

  private getPayload(): JwtPayload | null {
    const token = this.getToken();
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    try {
      const json = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(json) as JwtPayload;
    } catch {
      return null;
    }
  }
}