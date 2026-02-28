import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { filter, map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return authService.ready$.pipe(
        filter(ready => ready),
        take(1),
        map(() => {
            if (authService.currentUser) {
                return true;
            }
            return router.createUrlTree(['/login']);
        })
    );
};
