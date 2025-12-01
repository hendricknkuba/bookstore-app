import { Component, signal, computed } from '@angular/core';
import { NgForm, FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { BookModalComponent } from './book-modal/book-modal.component';

interface Author {
  author_id: number;
  name: string;
}

interface Book {
  book_id: number;
  title: string;
  author_id: number;
  author_name: string;
  image?: string | null;
}

interface Toast {
  id: number;
  type: 'success' | 'error';
  message: string;
}

@Component({
  standalone: true,
  selector: 'app-books-page',
  imports: [FormsModule, BookModalComponent],
  templateUrl: './books-page.component.html',
  styleUrls: ['./books-page.component.css'],
})
export class BooksPageComponent {
  books = signal<Book[]>([]);
  authors = signal<Author[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  newBookTitle = '';
  newBookAuthorId: number | null = null;
  newBookImage: string | null = null;

  modalOpen = signal(false);
  bookSelected = signal<Book | null>(null);

  searchTerm = signal('');
  filterAuthorId = signal<string>('all'); // 'all' ou id em string

  private toastIdCounter = 1;
  toasts = signal<Toast[]>([]);

  constructor(private auth: AuthService) {
    this.load();
  }

  filteredBooks = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const authorFilter = this.filterAuthorId();
    return this.books().filter((b) => {
      const matchesTitle =
        !term ||
        b.title.toLowerCase().includes(term) ||
        b.author_name.toLowerCase().includes(term);

      const matchesAuthor =
        authorFilter === 'all' || String(b.author_id) === authorFilter;

      return matchesTitle && matchesAuthor;
    });
  });

  private showToast(type: 'success' | 'error', message: string) {
    const id = this.toastIdCounter++;
    this.toasts.set([...this.toasts(), { id, type, message }]);
    setTimeout(() => {
      this.toasts.set(this.toasts().filter((t) => t.id !== id));
    }, 3000);
  }

  async load() {
    this.loading.set(true);
    this.error.set(null);

    try {
      const aRes = await this.auth.authFetch('http://localhost:3000/api/authors');
      const aData = await aRes.json();
      if (!aRes.ok || !aData.success) throw new Error(aData.message);
      this.authors.set(aData.data);

      const bRes = await this.auth.authFetch('http://localhost:3000/api/books');
      const bData = await bRes.json();
      if (!bRes.ok || !bData.success) throw new Error(bData.message);

      const storedImages = JSON.parse(localStorage.getItem('book_images') || '{}');

      const merged: Book[] = bData.data.map((b: any) => ({
        ...b,
        image: storedImages[b.book_id] || null,
      }));

      this.books.set(merged);
    } catch (e: any) {
      this.error.set(e.message);
      this.showToast('error', e.message || 'Error loading books');
    } finally {
      this.loading.set(false);
    }
  }

  compressImage(file: File, maxWidth = 300): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event: any) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const scaleFactor = maxWidth / img.width;

          canvas.width = maxWidth;
          canvas.height = img.height * scaleFactor;

          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7); 
          resolve(compressedDataUrl);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  }


  async handleImage(event: any) {
    const file = event.target.files[0];
    if (!file) {
      this.newBookImage = null;
      return;
    }

    this.newBookImage = await this.compressImage(file, 350);
  }

  async addBook(form: NgForm) {
    if (form.invalid) return;

    if (this.books().length >= 5) {
      const msg = 'Maximum limit of 5 books reached';
      this.error.set(msg);
      this.showToast('error', msg);
      return;
    }

    if (!this.newBookAuthorId) {
      const msg = 'Select an author';
      this.error.set(msg);
      this.showToast('error', msg);
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
          author_id: this.newBookAuthorId,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      const authorIdNum = Number(this.newBookAuthorId);

      const authorRecord = this.authors().find(
        a => Number(a.author_id) === authorIdNum
      );

      const newBook: Book = {
        ...data.data,
        title: this.newBookTitle,
        author_id: authorIdNum,
        author_name: authorRecord?.name ?? "Unknown",
        image: this.newBookImage,
      };

      this.books.set([...this.books(), newBook]);

      const stored = JSON.parse(localStorage.getItem('book_images') || '{}');
      stored[newBook.book_id] = this.newBookImage;
      localStorage.setItem('book_images', JSON.stringify(stored));

      this.newBookTitle = '';
      this.newBookAuthorId = null;
      this.newBookImage = null;
      form.resetForm();

      this.showToast('success', 'Book added successfully');
    } catch (e: any) {
      this.error.set(e.message);
      this.showToast('error', e.message || 'Error adding book');
    } finally {
      this.loading.set(false);
    }
  }

  openModal(book: Book) {
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
            author_id: payload.author_id,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      const updated = this.books().map((b) =>
        b.book_id === payload.book_id
          ? {
              ...b,
              title: payload.title,
              author_id: payload.author_id,
              author_name:
                this.authors().find((a) => a.author_id === payload.author_id)?.name ||
                '',
              image: payload.image,
            }
          : b
      );

      this.books.set(updated);

      const stored = JSON.parse(localStorage.getItem('book_images') || '{}');
      stored[payload.book_id] = payload.image;
      localStorage.setItem('book_images', JSON.stringify(stored));

      this.showToast('success', 'Book updated successfully');
    } catch (e: any) {
      this.error.set(e.message);
      this.showToast('error', e.message || 'Error updating book');
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

      this.books.set(this.books().filter((b) => b.book_id !== bookId));

      const stored = JSON.parse(localStorage.getItem('book_images') || '{}');
      delete stored[bookId];
      localStorage.setItem('book_images', JSON.stringify(stored));

      this.showToast('success', 'Book deleted');
    } catch (e: any) {
      this.error.set(e.message);
      this.showToast('error', e.message || 'Error deleting book');
    } finally {
      this.loading.set(false);
      this.modalOpen.set(false);
    }
  }
}
