import { Component, signal } from '@angular/core';
import { NgForm, FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

interface Author {
  author_id: number;
  name: string;
}

@Component({
  standalone: true,
  selector: 'app-authors-page',
  imports: [FormsModule],
  templateUrl: './authors-page.component.html',
  styleUrls: ['./authors-page.component.css'],
})
export class AuthorsPageComponent {
  authors = signal<Author[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // ⬇️ newAuthor agora é string normal → evita G5002
  newAuthorModel = '';

  constructor(private auth: AuthService) {
    this.loadAuthors();
  }

  async loadAuthors() {
    this.loading.set(true);
    this.error.set(null);

    try {
      const res = await this.auth.authFetch('http://localhost:3000/api/authors');
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Erro ao carregar autores');
      }

      this.authors.set(data.data);
    } catch (e: any) {
      this.error.set(e.message);
    } finally {
      this.loading.set(false);
    }
  }

  async addAuthor(form: NgForm) {
    if (form.invalid) return;

    if (this.authors().length >= 5) {
      this.error.set("Limite máximo de 5 autores atingido");
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    try {
      const res = await this.auth.authFetch('http://localhost:3000/api/authors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: this.newAuthorModel }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Erro ao adicionar autor");
      }

      // Atualiza lista
      this.authors.set([...this.authors(), data.data]);

      // Limpa input
      this.newAuthorModel = '';
      form.resetForm();

    } catch (e: any) {
      this.error.set(e.message);
    } finally {
      this.loading.set(false);
    }
  }
}
