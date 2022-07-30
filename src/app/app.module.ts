import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';

import {
    provideFirestore,
    getFirestore,
} from '@angular/fire/firestore';
import {
    provideStorage,
    getStorage,
} from '@angular/fire/storage';
import {
    provideAuth,
    getAuth,
    initializeAuth,
    browserLocalPersistence,
    browserPopupRedirectResolver,
} from '@angular/fire/auth';
import {
    provideAnalytics,
    getAnalytics,
    ScreenTrackingService,
    UserTrackingService,
} from '@angular/fire/analytics';

import { environment } from '../environments/environment';

// import { SocketIoModule, SocketIoConfig } from 'ngx-socket-io';

// import { GooglePlus } from '@ionic-native/google-plus/ngx';
// import { SocialSharing } from '@ionic-native/social-sharing/ngx';
// import { AndroidPermissions } from '@ionic-native/android-permissions/ngx';

import { GooglePlus } from '@awesome-cordova-plugins/google-plus/ngx';
import { SocialSharing } from '@awesome-cordova-plugins/social-sharing/ngx';
import { AndroidPermissions } from '@awesome-cordova-plugins/android-permissions/ngx';

import { getApp, initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { providePerformance, getPerformance } from '@angular/fire/performance';

// const socketOptions: SocketIoConfig['options'] = {
//     reconnection: false,
//     reconnectionAttempts: 1,
//     autoConnect: true,
//     //   reconnectionDelay : 1000,
//     //   reconnectionDelayMax : 5000,
//     //   upgrade : true,
//     //   path : '/',
// };

// const config: SocketIoConfig = {
//     url: 'https://canvassocketypescript.herokuapp.com',
//     // url: 'http://localhost:3000',
//     // url: 'https://canvasharesocket.herokuapp.com',
//     // options : socketOptions,
// };

@NgModule({
    declarations: [AppComponent],
    entryComponents: [],
    imports: [
        BrowserModule,
        IonicModule.forRoot(),
        AppRoutingModule,
        // SocketIoModule.forRoot(config),

        provideFirebaseApp(() => initializeApp(environment.firebase)),
        provideAnalytics(() => getAnalytics()),
        // provideAuth(() => getAuth()),
        provideAuth(() => (
            initializeAuth(getApp(), {
            persistence: browserLocalPersistence,
            popupRedirectResolver: browserPopupRedirectResolver
            })
        )),
        // provideAuth(() => (typeof document === 'undefined'
        //     ? getAuth(getApp())
        //     : initializeAuth(getApp(), {
        //         persistence: browserLocalPersistence,
        //         popupRedirectResolver: browserPopupRedirectResolver
        //     })
        // )),
        provideFirestore(() => getFirestore()),
        providePerformance(() => getPerformance()),
        provideStorage(() => getStorage()),
    ],
    providers: [
        { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
        GooglePlus,
        SocialSharing,
        AndroidPermissions,
        ScreenTrackingService,
        UserTrackingService,
    ],
    bootstrap: [AppComponent],
})
export class AppModule { }
