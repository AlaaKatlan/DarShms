import { Component, OnInit, AfterViewInit, ElementRef, ViewChildren, QueryList } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BookCardComponent } from '../../../shared/components/book-card/book-card.component';
import { Book, Author } from '../../../shared/models/book.model';
import { SupabaseService } from '../../../core/services/supabase.service';
import { CartService } from '../../../core/services/cart.service';
import { AlertService } from '../../../core/services/alert.service';

@Component({
  selector: 'app-books-list',
  standalone: true,
  imports: [CommonModule, RouterModule, BookCardComponent],
  templateUrl: './books-list.component.html',
  styleUrls: ['./books-list.component.scss']
})
export class BooksListComponent implements OnInit, AfterViewInit {
  books: Book[] = [];
  authors: Author[] = [];
  loading = true;
  loadingAuthors = true;

  // To handle the intersection observer logic for .anim elements
  @ViewChildren('animEl') animElements!: QueryList<ElementRef>;

  constructor(
    private supabase: SupabaseService,
    private cartService: CartService,
    private alertService: AlertService
  ) { }

  ngOnInit() {
    this.loadBooks();
    this.loadAuthors();
  }

  ngAfterViewInit() {
    // Scroll animations with stagger
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const delay = (entry.target as HTMLElement).dataset['delay'] || 0;
          setTimeout(() => entry.target.classList.add('visible'), Number(delay));
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    // We can observe elements with .anim class directly from the DOM 
    // since this is a simple presentation landing page
    setTimeout(() => {
      document.querySelectorAll('.anim').forEach((el) => {
        const siblings = el.parentElement?.querySelectorAll('.anim');
        if (siblings) {
          const idx = Array.from(siblings).indexOf(el);
          (el as HTMLElement).dataset['delay'] = (idx * 80).toString();
        }
        observer.observe(el);
      });
    }, 100);
  }

  async loadBooks() {
    this.loading = true;
    try {
      const { data, error } = await this.supabase.client
        .from('books')
        .select('*, author:authors(id, name)')
        .order('created_at', { ascending: false })
        .limit(8); // Load top 8 for landing page

      if (error) throw error;

      this.books = (data as unknown as Book[]) || [];
    } catch (error) {
      console.error('Error loading books', error);
      this.alertService.show('error', 'حدث خطأ أثناء تحميل الكتب');
    } finally {
      this.loading = false;
    }
  }

  async loadAuthors() {
    this.loadingAuthors = true;
    try {
      const { data, error } = await this.supabase.client
        .from('authors')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(6); // Load top 6 authors for landing page

      if (error) throw error;

      this.authors = (data as unknown as Author[]) || [];
    } catch (error) {
      console.error('Error loading authors', error);
    } finally {
      this.loadingAuthors = false;
    }
  }

  addToCart(book: Book) {
    this.cartService.addToCart(book, 1);
    this.alertService.show('success', `تم إضافة "${book.title}" إلى السلة`);
  }
}
