/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/member-ordering */
/* eslint-disable @angular-eslint/component-selector */
import { AfterViewInit, Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Validators } from '@angular/forms';
import { FormGroup } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

import { AlertController, MenuController } from '@ionic/angular';

import {
    fetchSignInMethodsForEmail,
    sendPasswordResetEmail,
} from '@angular/fire/auth';

import { User } from '../../common/model/user.model';

import { AuthService } from '../auth.service';
import { take } from 'rxjs/operators';
import { DialogService } from 'src/app/common/dialog.service';

@Component({
    selector: 'forgot-password',
    templateUrl: './forgot-password.page.html',
    styleUrls: ['./forgot-password.page.scss'],
})
export class ForgotPasswordPage implements OnInit, AfterViewInit, OnDestroy {

    public forgotPasswordForm: FormGroup;
    public inviteData: User = null;
    public emailId: string = null;

    public alive = true;

    constructor(
        private auth: AuthService,
        private formBuilder: FormBuilder,
        public router: Router,
        public alertController: AlertController,
        private route: ActivatedRoute,
        public menuCtrl: MenuController,
        public dialog: DialogService,
    ) {
        this.menuCtrl.enable(false);
    }

    /**************************************************************
 ****************Lifecycle functions*****************************
 *************************************************************/

    public ngOnInit(): void {
        this.buildForm();
    }

    public ngAfterViewInit(): void {
        if (!navigator.onLine) {
            this.dialog.showToast('Your network seems offline.. Please check your Internet connection');
            return;
        }
    }

    public ngOnDestroy(): void {
        this.alive = false;
    }

    public ionViewDidLeave(): void {
        this.alive = false;
    }

    /**************************************************************
     ****************Public Functions*****************************
     *************************************************************/

    public buildForm(): void {
        this.forgotPasswordForm = this.formBuilder.group({
            email: ['', Validators.compose([Validators.required, Validators.email])],
        });
    }

    public async presentAlert(header: string, message: string): Promise<void> {
        const alert = await this.alertController.create({
            header: `${header}`,
            message: `${message}`,
            buttons: ['Dismiss'],
            backdropDismiss: false,
        });
        alert.present();
    }

    public async onSubmit(): Promise<void> {
        await this.dialog.showLoader('Processing...');
        if (!navigator.onLine) {
            await this.dialog.dismissLoader();
            this.dialog.showToast('Your network seems offline.. Please check your Internet connection');
            return;
        }

        const signInArray: any[] = await fetchSignInMethodsForEmail(this.auth.afAuth, this.email.value);
        // const signInArray: any[] = await this.auth.afAuth.fetchSignInMethodsForEmail(this.email.value);

        if (signInArray && signInArray.length > 0) {
            if (signInArray.indexOf('password') !== -1) {
                sendPasswordResetEmail(this.auth.afAuth, this.email.value)
                // this.auth.afAuth.sendPasswordResetEmail(this.email.value)
                    .then(async () => {
                        await this.dialog.dismissLoader();

                        this.presentAlert('Alert', 'Please Check Your Email');
                        this.forgotPasswordForm.reset();
                    }).catch(async (err) => {
                        await this.dialog.dismissLoader();

                        this.presentAlert('Alert', err.message);
                        this.forgotPasswordForm.reset();
                    });
            } else {
                await this.dialog.dismissLoader();

                this.presentAlert('Alert', 'User has not signed in via Email');
                this.forgotPasswordForm.reset();
            }
        } else {
            await this.dialog.dismissLoader();

            this.presentAlert('Alert', 'No such Email exist!');
            this.forgotPasswordForm.reset();
        }

    }

    /**************************************************************
     ****************Get Functions*****************************
     *************************************************************/

    get email() {
        return this.forgotPasswordForm.get('email');
    }
}
