import { Component, HostListener } from '@angular/core';
import { RouterOutlet, RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/services/auth.service';
import { CartService } from './core/services/cart.service';
import { AlertComponent } from './shared/components/alert/alert.component';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule, CommonModule, AlertComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class AppComponent {
  title = 'darshms';

  constructor(
    public authService: AuthService,
    public cartService: CartService,
    private router: Router
  ) { }

  isScrolled = false;
  mobileMenuOpen = false;

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled = window.scrollY > 20;
  }

  get cartItemCount() {
    return this.cartService.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  // ✅ يقرأ من profiles table مش user_metadata
  get isAdmin$() {
    return this.authService.profile$.pipe(
      map(profile => profile?.role === 'admin')
    );
  }

  async logout() {
    await this.authService.signOut();
  }

  get isStorefront() {
    return !this.router.url.startsWith('/admin');
  }

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu() {
    this.mobileMenuOpen = false;
  }
}
