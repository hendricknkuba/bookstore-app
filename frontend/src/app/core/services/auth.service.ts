import { Injectable, signal, computed } from '@angular/core';

interface AuthUser {
  user_id: number;
  email: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiBase = 'http://localhost:3000/api/auth';

  user = signal<AuthUser | null>(null);
  token = signal<string | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  isAuthenticated = computed(() => this.token() !== null);

    constructor() {
        const savedToken = localStorage.getItem('auth_token');
        const savedUser = localStorage.getItem('auth_user');

        if (savedToken) {
            this.token.set(savedToken);
        }

        if (savedUser) {
            try {
            const parsed = JSON.parse(savedUser);
            this.user.set(parsed);
            } catch (err) {
            console.warn('auth_user invalid in localStorage, clearing it.');
            localStorage.removeItem('auth_user');
            }
        }
    }

  async register(email: string, password: string) {
    this.loading.set(true);
    this.error.set(null);

    try {
      const res = await fetch(`${this.apiBase}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Error registering');
      }

      // register → auto login
      await this.login(email, password);

    } catch (e: any) {
      this.error.set(e.message);
    } finally {
      this.loading.set(false);
    }
  }

  async login(email: string, password: string) {
    this.loading.set(true);
    this.error.set(null);

    try {
      const res = await fetch(`${this.apiBase}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Error logging in');
      }

      this.token.set(data.token);
      this.user.set(data.user);

      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));

    } catch (e: any) {
      this.error.set(e.message);
    } finally {
      this.loading.set(false);
    }
  }

  logout() {
    this.token.set(null);
    this.user.set(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    this.error.set(null);
  }

  async authFetch(url: string, init: RequestInit = {}) {
    const t = this.token();

    const headers = new Headers(init.headers || {});
    if (t) headers.set('Authorization', `Bearer ${t}`);

    return fetch(url, { ...init, headers });
  }
}