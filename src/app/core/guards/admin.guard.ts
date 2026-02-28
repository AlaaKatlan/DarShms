import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return authService.currentUser$.pipe(
        take(1),
        map(user => {
            // Assuming role is stored in user metadata
            if (user && user.user_metadata?.['role'] === 'admin') {
                return true;
            }
            return router.createUrlTree(['/']);
        })
    );
};
