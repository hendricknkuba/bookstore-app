import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';

@Component({
  standalone: true,
  selector: 'app-book-modal',
  imports: [FormsModule],
  templateUrl: './book-modal.component.html',
  styleUrls: ['./book-modal.component.css'],
})
export class BookModalComponent {
  @Input() open = false;
  @Input() book: any = null;
  @Input() authors: any[] = [];

  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();
  @Output() delete = new EventEmitter<number>();

  titleModel = '';
  authorModel: number | null = null;
  imageModel: string | null = null;

  ngOnChanges() {
    if (this.book) {
      this.titleModel = this.book.title;
      this.authorModel = this.book.author_id;
      this.imageModel = this.book.image || null;
    }
  }

  handleImage(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      this.imageModel = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  submit() {
    this.save.emit({
      book_id: this.book.book_id,
      title: this.titleModel,
      author_id: this.authorModel,
      image: this.imageModel
    });
  }

  deleteBook() {
    this.delete.emit(this.book.book_id);
  }
}