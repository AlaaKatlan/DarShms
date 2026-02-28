import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { SupabaseService } from '../services/supabase.service';
import { from, switchMap } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const supabaseService = inject(SupabaseService);

    return from(supabaseService.client.auth.getSession()).pipe(
        switchMap(({ data }) => {
            const token = data.session?.access_token;

            if (token) {
                const clonedReq = req.clone({
                    setHeaders: {
                        Authorization: `Bearer ${token}`
                    }
                });
                return next(clonedReq);
            }

            return next(req);
        })
    );
};
