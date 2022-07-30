import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})

export class AuthGuard implements CanActivate {
    constructor(
        private router: Router,
        public auth: AuthService,
    ) {

    }

    /**************************************************************
    ****************Public Functions*******************************
    *************************************************************/

    public canActivate(
        next: ActivatedRouteSnapshot,
        state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
        return this.auth.user$.pipe(map(user => this.shouldAllow(user, state.url)));
    }

    public shouldAllow(user: any, url: any): boolean {
        if (user) {
            return true;
        } else {
            console.log('redirected to login');
            this.router.navigate(['/login'], { queryParams: { returnUrl: url } });
            return false;
        }
    }
}
