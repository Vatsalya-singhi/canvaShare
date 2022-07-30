import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './auth/auth-guard.service';
import { RoomGuard } from './common/room-guard.service';

const routes: Routes = [
    {
        path: 'front',
        loadChildren: () => import('./page/front/front.module').then(m => m.FrontPageModule),
        canActivate: [AuthGuard]
    },
    {
        path: 'home',
        loadChildren: () => import('./page/home/home.module').then(m => m.HomePageModule),
        canActivate: [AuthGuard, RoomGuard]
    },
    {
        path: '',
        redirectTo: 'front',
        pathMatch: 'full'
    },
    {
        path: 'login',
        loadChildren: () => import('./auth/login/login.module').then(m => m.LoginPageModule)
    },
    {
        path: 'forgot-password',
        loadChildren: () => import('./auth/forgot-password/forgot-password.module').then(m => m.ForgotPasswordPageModule)
    },
    {
        path: 'signup',
        loadChildren: () => import('./auth/signup/signup.module').then(m => m.SignupPageModule)
    },
    {
        path: '**',
        redirectTo: 'front',
    },
];

@NgModule({
    imports: [
        RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
    ],
    exports: [RouterModule]
})
export class AppRoutingModule { }
