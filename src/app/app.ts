import { Component, HostListener } from '@angular/core';
import { RouterOutlet, RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/services/auth.service';
import { CartService } from './core/services/cart.service';
import { AlertComponent } from './shared/components/alert/alert.component';

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

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled = window.scrollY > 20;
  }

  get cartItemCount() {
    return this.cartService.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  isAdmin() {
    return this.authService.currentUser?.user_metadata?.['role'] === 'admin';
  }

  async logout() {
    await this.authService.signOut();
  }

  // Show header/footer only if we are not in admin panel
  get isStorefront() {
    return !this.router.url.startsWith('/admin');
  }
}
