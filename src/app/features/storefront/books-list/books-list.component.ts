import { Component, OnInit, AfterViewInit } from '@angular/core';
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

    constructor(
        private supabase: SupabaseService,
        private cartService: CartService,
        private alertService: AlertService
    ) {}

    ngOnInit() {
        // Run debug test first
        this.supabase.testConnection();

        this.loadBooks();
        this.loadAuthors();
    }

    ngAfterViewInit() {
        setTimeout(() => {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const delay = (entry.target as HTMLElement).dataset['delay'] || '0';
                        setTimeout(() => entry.target.classList.add('visible'), Number(delay));
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

            document.querySelectorAll('.anim').forEach((el, idx) => {
                (el as HTMLElement).dataset['delay'] = (idx * 60).toString();
                observer.observe(el);
            });
        }, 200);
    }

    async loadBooks() {
        this.loading = true;
        try {
            // Use the helper method
            const { data, error } = await this.supabase.getBooks({
                limit: 8,
                activeOnly: true
            });

            if (error) {
                console.error('loadBooks ERROR:', error);
                this.alertService.show('error', 'خطأ في تحميل الكتب: ' + (error.message || JSON.stringify(error)));
                return;
            }

            console.log('loadBooks SUCCESS - raw data:', data);
            this.books = data as Book[];
            console.log('Books loaded:', this.books.length, this.books);

        } catch (error: any) {
            console.error('loadBooks CATCH:', error);
            this.alertService.show('error', 'حدث خطأ أثناء تحميل الكتب');
        } finally {
            this.loading = false;
        }
    }

    async loadAuthors() {
        this.loadingAuthors = true;
        try {
            const { data, error } = await this.supabase.getAuthors({
                limit: 6,
                activeOnly: true
            });

            if (error) {
                console.error('loadAuthors ERROR:', error);
                return;
            }

            console.log('loadAuthors SUCCESS:', data);
            this.authors = data as Author[];

        } catch (error) {
            console.error('loadAuthors CATCH:', error);
        } finally {
            this.loadingAuthors = false;
        }
    }

    addToCart(book: Book) {
        this.cartService.addToCart(book, 1);
        this.alertService.show('success', `تم إضافة "${book.title}" إلى السلة`);
    }
}
