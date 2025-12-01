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
        throw new Error(data.message || 'Error loading authors');
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
      this.error.set("Maximum limit of 5 authors reached");
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
        throw new Error(data.message || "Error adding author");
      }

      this.authors.set([...this.authors(), data.data]);

      this.newAuthorModel = '';
      form.resetForm();

    } catch (e: any) {
      this.error.set(e.message);
    } finally {
      this.loading.set(false);
    }
  }
}
