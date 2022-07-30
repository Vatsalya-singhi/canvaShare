import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { FrontPageRoutingModule } from './front-routing.module';

import { FrontPage } from './front.page';
// import { AngularFireAnalyticsModule } from '@angular/fire/analytics';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        FrontPageRoutingModule,
        ReactiveFormsModule,
        // AngularFireAnalyticsModule
    ],
    declarations: [FrontPage]
})
export class FrontPageModule { }
