import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { HomePage } from './home.page';

import { HomePageRoutingModule } from './home-routing.module';
import { OptionsComponent } from 'src/app/common/components/options/options.component';
import { PeopleComponent } from 'src/app/common/components/people/people.component';
// import { AngularFireAnalyticsModule } from '@angular/fire/analytics';
import { CallComponent } from 'src/app/common/components/call/call.component';
import { AbsoluteDrag } from 'src/app/common/directives/absolute-drag.directive';

import { SwiperModule } from 'swiper/angular';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        HomePageRoutingModule,
        SwiperModule,
        // AngularFireAnalyticsModule
    ],
    declarations: [
        HomePage,
        OptionsComponent,
        PeopleComponent,
        CallComponent,
        AbsoluteDrag
    ],
    entryComponents: [
        OptionsComponent,
        PeopleComponent,
        CallComponent,
    ]
})
export class HomePageModule { }
