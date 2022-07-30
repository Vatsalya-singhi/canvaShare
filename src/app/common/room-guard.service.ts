import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SocketService } from './socket.service';

@Injectable({
    providedIn: 'root'
})

export class RoomGuard implements CanActivate {
    constructor(
        private router: Router,
        public auth: AuthService,
        public socketService: SocketService,
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
        console.log('url=>',url);
        if(url === '/home' && this.socketService.configuration && this.socketService.configuration.room != null) {
            return true;
        }
        this.router.navigate(['/front']);
        return false;
    }
}
