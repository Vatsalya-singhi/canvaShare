import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SignupPageRoutingModule } from './signup-routing.module';

import { SignupPage } from './signup.page';
import { AuthService } from '../auth.service';

// import { Ng2ImgMaxModule } from 'ng2-img-max';

import {
    provideAuth,
    getAuth,
  } from '@angular/fire/auth';

import {
    provideStorage,
    getStorage,
} from '@angular/fire/storage';


@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        SignupPageRoutingModule,
        ReactiveFormsModule,
        // Ng2ImgMaxModule,

        provideAuth(() => getAuth()),
        provideStorage(() => getStorage()),
    ],
    declarations: [
        SignupPage,
    ],
    providers: [
        AuthService
    ]
})
export class SignupPageModule { }
