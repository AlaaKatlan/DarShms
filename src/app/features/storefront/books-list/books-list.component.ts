import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router'; // إضافة ActivatedRoute
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

    showAllBooks = false;

    // Carousel
    @ViewChild('carouselTrack') carouselTrackRef!: ElementRef<HTMLElement>;
    activeCarouselIndex = 0;

    readonly CAROUSEL_GROUP_SIZE = 5;

    get carouselGroupCount(): number {
        return Math.ceil(this.authors.length / this.CAROUSEL_GROUP_SIZE);
    }

    get activeGroupIndex(): number {
        return Math.floor(this.activeCarouselIndex / this.CAROUSEL_GROUP_SIZE);
    }

    get carouselGroupsArray(): number[] {
        return Array.from({ length: this.carouselGroupCount });
    }

    private observer: IntersectionObserver | null = null;
    private mutationObserver: MutationObserver | null = null;
    private carouselInterval: any = null;

    constructor(
        private supabase: SupabaseService,
        private cartService: CartService,
        private alertService: AlertService,
        private route: ActivatedRoute // حقن ActivatedRoute
    ) {}

    ngOnInit() {
        // مراقبة الـ query params لمعرفة إذا تم الضغط على "تصفح جميع إصداراتنا"
        this.route.queryParams.subscribe(params => {
            this.showAllBooks = params['all'] === 'true';

            // إعادة تحميل الكتب بناءً على الحالة الجديدة
            this.loadBooks();

            // إذا كنا نعرض كل الكتب، لا داعي لتحميل المؤلفين (اختياري)
            if (!this.showAllBooks) {
                this.loadAuthors();
            }

            // التمرير لأعلى الصفحة عند التبديل
            if (this.showAllBooks) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    }

    ngAfterViewInit() {
        this.setupIntersectionObserver();
        this.setupMutationObserver();
        this.observeNewElements();
        // نبدأ الـ auto-scroll بعد تحميل البيانات
        setTimeout(() => this.startCarouselAutoPlay(), 800);
    }

    ngOnDestroy() {
        if (this.observer) this.observer.disconnect();
        if (this.mutationObserver) this.mutationObserver.disconnect();
        if (this.carouselInterval) clearInterval(this.carouselInterval);
    }

    startCarouselAutoPlay() {
        if (this.carouselInterval) clearInterval(this.carouselInterval);
        this.carouselInterval = setInterval(() => {
            const track = this.carouselTrackRef?.nativeElement;
            if (!track) return;
            const cardWidth = track.querySelector('.writer-card')?.clientWidth || 240;
            const gap = 24;
            const maxScroll = track.scrollWidth - track.clientWidth;

            if (track.scrollLeft <= 0) {
                track.scrollTo({ left: maxScroll, behavior: 'smooth' });
                this.activeCarouselIndex = this.authors.length - 1;
            } else {
                track.scrollBy({ left: -(cardWidth + gap), behavior: 'smooth' });
                setTimeout(() => {
                    const scrolled = maxScroll - track.scrollLeft;
                    const idx = Math.round(scrolled / (cardWidth + gap));
                    this.activeCarouselIndex = Math.max(0, Math.min(idx, this.authors.length - 1));
                }, 350);
            }
        }, 1800);
    }

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

    private setupMutationObserver() {
        this.mutationObserver = new MutationObserver(() => {
            this.observeNewElements();
        });

        this.mutationObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    private observeNewElements() {
        // كل group من siblings يأخذ delay متدرج
        document.querySelectorAll('.anim:not(.visible)').forEach((el) => {
            const element = el as HTMLElement;
            if (!element.dataset['delay']) {
                // احسب الـ index داخل الـ parent
                const siblings = Array.from(element.parentElement?.querySelectorAll('.anim') || []);
                const idx = siblings.indexOf(element);
                element.dataset['delay'] = (idx * 80).toString();
            }
            this.observer?.observe(element);
        });
    }

    async loadBooks() {
        this.loading = true;
        try {
            // تجهيز الإعدادات، إذا كان showAllBooks صحيح، نرسل undefined كـ limit لجلب الكل
            const options = {
                limit: this.showAllBooks ? undefined : 8,
                activeOnly: true
            };

            const { data, error } = await this.supabase.getBooks(options);

            if (error) {
                console.error('loadBooks ERROR:', error);
                this.alertService.show('error', 'خطأ في تحميل الكتب: ' + (error.message || JSON.stringify(error)));
                return;
            }

            this.books = data as Book[];
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
                activeOnly: true
            });

            if (error) return;
            this.authors = data as Author[];
        } catch (error) {
            console.error('loadAuthors CATCH:', error);
        } finally {
            this.loadingAuthors = false;
        }
    }

    scrollCarousel(direction: number) {
        const track = this.carouselTrackRef?.nativeElement;
        if (!track) return;
        const cardWidth = track.querySelector('.writer-card')?.clientWidth || 280;
        const gap = 24;
        const scrollAmount = (cardWidth + gap) * direction;
        track.scrollBy({ left: -scrollAmount, behavior: 'smooth' });

        // إيقاف مؤقت عند التدخل اليدوي، ثم استئناف بعد 6 ثواني
        if (this.carouselInterval) clearInterval(this.carouselInterval);
        setTimeout(() => this.startCarouselAutoPlay(), 3000);
    }

    addToCart(book: Book) {
        this.cartService.addToCart(book, 1);
        this.alertService.show('success', `تم إضافة "${book.title}" إلى السلة`);
    }
}
