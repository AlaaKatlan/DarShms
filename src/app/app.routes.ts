import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
    // Storefront
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

    // Auth
    {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
    },
    {
        path: 'register',
        loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
    },

    // Admin - also lazy load the layout
    {
        path: 'admin',
        canActivate: [adminGuard],
        loadComponent: () => import('./features/admin/layout/admin-layout.component').then(m => m.AdminLayoutComponent),
        children: [
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' as const },
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
