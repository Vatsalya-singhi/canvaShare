import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
// import { AngularFireAuthModule } from '@angular/fire/auth';
// import { AngularFireAnalyticsModule } from '@angular/fire/analytics';
import {
    provideAuth,
    getAuth,
  } from '@angular/fire/auth';
  import {
    provideAnalytics,
    getAnalytics,
  } from '@angular/fire/analytics';

import { IonicModule } from '@ionic/angular';

import { LoginPageRoutingModule } from './login-routing.module';

import { LoginPage } from './login.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    LoginPageRoutingModule,

    ReactiveFormsModule,
    // AngularFireAuthModule,
    // AngularFireAnalyticsModule,

    provideAnalytics(() => getAnalytics()),
    provideAuth(() => getAuth()),
  ],
  declarations: [LoginPage],
})
export class LoginPageModule {}
