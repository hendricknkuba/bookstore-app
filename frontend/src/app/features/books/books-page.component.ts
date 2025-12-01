import { Component, signal } from '@angular/core';
import { NgForm, FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

interface Book {
  book_id: number;
  title: string;
  author_id: number;
  author_name: string;
}

@Component({
  standalone: true,
  selector: 'app-books-page',
  imports: [FormsModule],
  templateUrl: './books-page.component.html',
  styleUrls: ['./books-page.component.css'],
})
export class BooksPageComponent {
  books = signal<(Book & { image?: string | null })[]>([]);
  authors = signal<{ author_id: number; name: string }[]>([]);

  loading = signal(false);
  error = signal<string | null>(null);

  // form fields
  newBookTitle = '';
  newBookAuthorId: number | null = null;
  newBookImage: string | null = null;

  constructor(private auth: AuthService) {
    this.load();
  }

  async load() {
    this.loading.set(true);
    this.error.set(null);

    try {
      // Load authors
      const authorsRes = await this.auth.authFetch('http://localhost:3000/api/authors');
      const authorsData = await authorsRes.json();

      if (!authorsRes.ok || !authorsData.success) throw new Error(authorsData.message);

      this.authors.set(authorsData.data);

      // Load books
      const booksRes = await this.auth.authFetch('http://localhost:3000/api/books');
      const booksData = await booksRes.json();

      if (!booksRes.ok || !booksData.success) throw new Error(booksData.message);

      const storedImages = JSON.parse(localStorage.getItem('book_images') || '{}');

      // Merge images from localStorage
      const booksWithImages = booksData.data.map((b: Book) => ({
        ...b,
        image: storedImages[b.book_id] || null
      }));

      this.books.set(booksWithImages);
    } catch (e: any) {
      this.error.set(e.message);
    } finally {
      this.loading.set(false);
    }
  }

  handleImage(event: any) {
    const file = event.target.files[0];
    if (!file) {
      this.newBookImage = null;
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.newBookImage = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  async addBook(form: NgForm) {
    if (form.invalid) return;

    if (this.books().length >= 5) {
      this.error.set("Limite de 5 livros atingido");
      return;
    }

    if (!this.newBookAuthorId) {
      this.error.set("Selecione um autor");
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    try {
      const res = await this.auth.authFetch('http://localhost:3000/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: this.newBookTitle,
          author_id: this.newBookAuthorId
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      const newBook = {
        ...data.data,
        author_name: this.authors().find(a => a.author_id === this.newBookAuthorId)?.name || "",
        image: this.newBookImage
      };

      this.books.set([...this.books(), newBook]);

      // Save Image in LocalStorage
      const stored = JSON.parse(localStorage.getItem('book_images') || '{}');
      stored[newBook.book_id] = this.newBookImage;
      localStorage.setItem('book_images', JSON.stringify(stored));

      // Reset form
      this.newBookTitle = '';
      this.newBookAuthorId = null;
      this.newBookImage = null;
      form.resetForm();

    } catch (e: any) {
      this.error.set(e.message);
    } finally {
      this.loading.set(false);
    }
  }
}