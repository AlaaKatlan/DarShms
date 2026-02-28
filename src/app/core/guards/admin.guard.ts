import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { filter, map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // Wait for auth to be ready, then check role from profiles table
    return authService.ready$.pipe(
        filter(ready => ready),
        take(1),
        map(() => {
            if (authService.isAdmin) {
                return true;
            }
            return router.createUrlTree(['/login']);
        })
    );
};
