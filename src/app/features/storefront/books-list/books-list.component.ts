import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
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
export class BooksListComponent implements OnInit, AfterViewInit, OnDestroy {
    books: Book[] = [];
    authors: Author[] = [];
    loading = true;
    loadingAuthors = true;

    // المراقب المسؤول عن الأنيميشن أثناء التمرير
    private observer: IntersectionObserver | null = null;
    // المراقب المسؤول عن اكتشاف وصول الكتب والكتاب من قاعدة البيانات
    private mutationObserver: MutationObserver | null = null;

    constructor(
        private supabase: SupabaseService,
        private cartService: CartService,
        private alertService: AlertService
    ) {}

    ngOnInit() {
        this.supabase.testConnection();
        this.loadBooks();
        this.loadAuthors();
    }

    ngAfterViewInit() {
        this.setupIntersectionObserver();
        this.setupMutationObserver();
        this.observeNewElements();
    }

    ngOnDestroy() {
        // تنظيف المراقبين عند مغادرة الصفحة لتجنب تسريب الذاكرة
        if (this.observer) this.observer.disconnect();
        if (this.mutationObserver) this.mutationObserver.disconnect();
    }

    // 1. إعداد الـ Intersection Observer
    private setupIntersectionObserver() {
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const target = entry.target as HTMLElement;
                    const delay = target.dataset['delay'] || '0';
                    setTimeout(() => target.classList.add('visible'), Number(delay));
                    this.observer?.unobserve(target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    }

    // 2. إعداد الـ Mutation Observer (الحل الجذري لمشكلة اختفاء الكتب)
    private setupMutationObserver() {
        this.mutationObserver = new MutationObserver(() => {
            // كلما تغير شيء في الصفحة (مثل ظهور الكتب الجديدة)، استدعِ هذه الدالة
            this.observeNewElements();
        });

        this.mutationObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // 3. البحث عن العناصر الجديدة وإضافتها للأنيميشن
    private observeNewElements() {
        document.querySelectorAll('.anim:not(.visible)').forEach((el, idx) => {
            const element = el as HTMLElement;
            if (!element.dataset['delay']) {
                element.dataset['delay'] = (idx * 50).toString(); // تأخير 50ms بين كل كتاب ليظهروا بشكل متتالي
            }
            this.observer?.observe(element);
        });
    }

    async loadBooks() {
        this.loading = true;
        try {
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
