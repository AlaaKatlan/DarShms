import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

// Import Layout
import { AdminLayoutComponent } from './features/admin/layout/admin-layout.component';

export const routes: Routes = [
    // Storefront Phase 3
    {
        path: '',
        loadComponent: () => import('./features/storefront/books-list/books-list.component').then(m => m.BooksListComponent)
    },
    {
        path: 'books',
        loadComponent: () => import('./features/storefront/books-list/books-list.component').then(m => m.BooksListComponent)
    },
    {
        path: 'books/:id',
        loadComponent: () => import('./features/storefront/book-detail/book-detail.component').then(m => m.BookDetailComponent)
    },
    {
        path: 'cart',
        loadComponent: () => import('./features/storefront/cart/cart.component').then(m => m.CartComponent)
    },
    {
        path: 'checkout',
        canActivate: [authGuard],
        loadComponent: () => import('./features/storefront/checkout/checkout.component').then(m => m.CheckoutComponent)
    },

    // Auth Phase 4
    {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
    },
    {
        path: 'register',
        loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
    },

    // Admin Phase 5
    {
        path: 'admin',
        component: AdminLayoutComponent,
        canActivate: [adminGuard],
        children: [
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
            { path: 'dashboard', loadComponent: () => import('./features/admin/dashboard/dashboard.component').then(m => m.DashboardComponent) },
            { path: 'books', loadComponent: () => import('./features/admin/books/books-management.component').then(m => m.BooksManagementComponent) },
            { path: 'authors', loadComponent: () => import('./features/admin/authors/authors-management.component').then(m => m.AuthorsManagementComponent) },
            { path: 'orders', loadComponent: () => import('./features/admin/orders/orders-management.component').then(m => m.OrdersManagementComponent) },
            { path: 'customers', loadComponent: () => import('./features/admin/customers/customers-list.component').then(m => m.CustomersListComponent) },
            { path: 'reports', loadComponent: () => import('./features/admin/reports/reports-dashboard.component').then(m => m.ReportsDashboardComponent) },
            { path: 'settings', loadComponent: () => import('./features/admin/settings/settings.component').then(m => m.SettingsComponent) }
        ]
    },

    { path: '**', redirectTo: '' }
];
