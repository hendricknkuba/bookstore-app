import { Component, signal } from '@angular/core';
import { NgForm, FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { BookModalComponent } from './book-modal/book-modal.component';

@Component({
  standalone: true,
  selector: 'app-books-page',
  imports: [FormsModule, BookModalComponent],
  templateUrl: './books-page.component.html',
  styleUrls: ['./books-page.component.css'],
})
export class BooksPageComponent {

  books = signal<any[]>([]);
  authors = signal<any[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  newBookTitle = '';
  newBookAuthorId: number | null = null;
  newBookImage: string | null = null;

  modalOpen = signal(false);
  bookSelected = signal<any | null>(null);

  constructor(private auth: AuthService) {
    this.load();
  }

  async load() {
    this.loading.set(true);
    this.error.set(null);

    try {
      // Load authors
      const aRes = await this.auth.authFetch('http://localhost:3000/api/authors');
      const aData = await aRes.json();
      if (!aRes.ok || !aData.success) throw new Error(aData.message);
      this.authors.set(aData.data);

      // Load books
      const bRes = await this.auth.authFetch('http://localhost:3000/api/books');
      const bData = await bRes.json();
      if (!bRes.ok || !bData.success) throw new Error(bData.message);

      const storedImages = JSON.parse(localStorage.getItem('book_images') || '{}');

      const merged = bData.data.map((b: any) => ({
        ...b,
        image: storedImages[b.book_id] || null
      }));

      this.books.set(merged);
    } catch (e: any) {
      this.error.set(e.message);
    } finally {
      this.loading.set(false);
    }
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
            const res = await this.auth.authFetch(
            'http://localhost:3000/api/books',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                title: this.newBookTitle,
                author_id: this.newBookAuthorId
                })
            }
            );

            const data = await res.json();
            if (!res.ok || !data.success) {
            throw new Error(data.message);
            }

            const newBook = {
            ...data.data,
            author_name: this.authors().find(a => a.author_id === this.newBookAuthorId)?.name || "",
            image: this.newBookImage
            };

            // atualiza lista
            this.books.set([...this.books(), newBook]);

            // salvar imagem no localStorage
            const stored = JSON.parse(localStorage.getItem('book_images') || '{}');
            stored[newBook.book_id] = this.newBookImage;
            localStorage.setItem('book_images', JSON.stringify(stored));

            // reset form
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
  openModal(book: any) {
    this.bookSelected.set(book);
    this.modalOpen.set(true);
  }

  async updateBook(payload: any) {
    this.loading.set(true);

    try {
      const res = await this.auth.authFetch(
        `http://localhost:3000/api/books/${payload.book_id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: payload.title,
            author_id: payload.author_id
          }),
        }
      );

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      // update frontend list
      const updated = this.books().map(b =>
        b.book_id === payload.book_id
          ? { ...b, title: payload.title, author_id: payload.author_id, author_name: this.authors().find(a => a.author_id === payload.author_id)?.name, image: payload.image }
          : b
      );

      this.books.set(updated);

      // update localStorage image
      const stored = JSON.parse(localStorage.getItem('book_images') || '{}');
      stored[payload.book_id] = payload.image;
      localStorage.setItem('book_images', JSON.stringify(stored));

    } catch (e: any) {
      this.error.set(e.message);
    } finally {
      this.loading.set(false);
      this.modalOpen.set(false);
    }
  }

  async deleteBook(bookId: number) {
    this.loading.set(true);

    try {
      const res = await this.auth.authFetch(
        `http://localhost:3000/api/books/${bookId}`,
        { method: 'DELETE' }
      );

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      this.books.set(this.books().filter(b => b.book_id !== bookId));

      const stored = JSON.parse(localStorage.getItem('book_images') || '{}');
      delete stored[bookId];
      localStorage.setItem('book_images', JSON.stringify(stored));

    } catch (e: any) {
      this.error.set(e.message);
    } finally {
      this.loading.set(false);
      this.modalOpen.set(false);
    }
  }
}