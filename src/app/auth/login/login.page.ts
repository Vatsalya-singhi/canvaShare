/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @angular-eslint/component-selector */
/* eslint-disable @typescript-eslint/member-ordering */
import { Component, OnDestroy, OnInit, AfterViewInit } from '@angular/core';

import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

import { AlertController, MenuController } from '@ionic/angular';
import { takeWhile, take } from 'rxjs/operators';

import { AuthService } from '../auth.service';
import { DialogService } from 'src/app/common/dialog.service';
// import { AngularFireAnalytics } from '@angular/fire/analytics';
import { sendEmailVerification } from '@angular/fire/auth';

import { logEvent, Analytics } from '@angular/fire/analytics';
import { LoggerService } from 'src/app/common/logger.service';
import { User } from 'src/app/common/model/user.model';

@Component({
    selector: 'login',
    templateUrl: './login.page.html',
    styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit, AfterViewInit, OnDestroy {
    public loginForm: FormGroup;
    public returnUrl = '';
    private alive = true;

    constructor(
        private auth: AuthService,
        private formBuilder: FormBuilder,
        public router: Router,
        private route: ActivatedRoute,
        public alertController: AlertController,
        public dialog: DialogService,
        public menuCtrl: MenuController,
        // public analytics: AngularFireAnalytics,
        public analytics: Analytics,
        public logger: LoggerService
    ) {
        this.menuCtrl.enable(false);

        // WHY AM I DOING THIS ??!
        const checkGoogle2 = localStorage.getItem('google2method');
        // if (checkGoogle2) {
        //     this.dialog.showLoader('Please Wait...');
        //     localStorage.removeItem('google2method');
        // }

        this.auth.user$.pipe(takeWhile(() => this.alive)).subscribe(
            (userData: User) => {
                if (userData && userData.id) {
                    if (checkGoogle2) {
                        this.dialog.dismissLoader();
                        localStorage.removeItem('google2method');
                    }
                    if (this.returnUrl) {
                        this.router.navigate([this.returnUrl]);
                    } else {
                        this.router.navigate(['/front']);
                    }
                }
            },
            (err) => {
                if (checkGoogle2) {
                    this.dialog.dismissLoader();
                    localStorage.removeItem('google2method');
                }
                console.log('err=>', err);
            }
        );

        // Fail Safe method
        setTimeout(async () => {
            try {
                await this.dialog.dismissLoader();
                localStorage.removeItem('google2method');
            } catch (err) {
                console.log('err=>', err);
            }
        }, 10000);
    }

    /**************************************************************
     ****************Lifecycle functions*****************************
     *************************************************************/

    public ngOnInit(): void {
        this.buildForm();
    }

    public ngAfterViewInit(): void {
        if (!navigator.onLine) {
            this.dialog.showToast(
                'Your network seems offline.. Please check your Internet connection'
            );
        }
    }

    public ionViewDidLeave(): void {
        this.alive = false;
    }

    public ngOnDestroy(): void {
        this.alive = false;
    }

    /**************************************************************
     ****************Public functions*****************************
     *************************************************************/

    public buildForm(): void {
        this.loginForm = this.formBuilder.group({
            email: ['', Validators.compose([Validators.required, Validators.email])],
            password: ['', Validators.compose([Validators.required])],
        });

        this.route.queryParams
            .pipe(takeWhile(() => this.alive))
            .subscribe((params) => {
                this.returnUrl = params.returnUrl;
            });
    }

    public async onSubmit(): Promise<void> {
        //email check
        await this.dialog.showLoader('Please Wait...');

        const data = this.loginForm.value;
        if (!data.email || !data.password) {
            await this.dialog.dismissLoader();
            return;
        }

        if (!navigator.onLine) {
            await this.dialog.dismissLoader();
            this.dialog.showToast('Please check your Internet connection');
            return;
        }

        const credentials = {
            email: data.email,
            password: data.password,
        };

        this.auth
            .signInWithEmail(credentials)
            .then(async (user) => {
                if (!user.emailVerified) {
                    console.log('Please verify your Email');
                    await this.dialog.dismissLoader();
                    this.presentAlertConfirm();
                    return;
                }

                this.auth.user$.pipe(takeWhile(() => this.alive)).subscribe(
                    async () => {
                        await this.dialog.dismissLoader();

                        if (this.auth.user && this.auth.user.id.length > 0) {
                            if (this.returnUrl) {
                                this.router.navigate([this.returnUrl]);
                            } else {
                                this.router.navigate([`/front`]);
                            }
                        }
                    },
                    async (err) => {
                        await this.dialog.dismissLoader();
                        console.log('err=>', err);
                    }
                );
            })
            .catch(async (error) => {
                console.log('error=>', error, error.message);
                await this.dialog.dismissLoader();

                if (error.code === 'auth/wrong-password') {
                    this.presentAlert('Alert!', 'Incorrect Password Entered!');
                } else if (error.code === 'auth/user-not-found') {
                    this.presentAlert('Alert!', 'Incorrect Email / Email Not Found !');
                } else if (error.code === 'auth/web-storage-unsupported') {
                    this.presentAlert(
                        'Alert!',
                        `Browser Error.. Please allow 3rd party cookies and data storage..`
                    );
                } else {
                    this.presentAlert('Alert!', error.message);
                }

                await this.logger.log({
                    error: error.message,
                    type: 'email signin',
                    createdAt: new Date(),
                });
            });
    }

    public register(): void {
        this.loginForm.reset();
        this.router.navigate([`/signup`]);
    }

    public forgotPassword(): void {
        this.loginForm.reset();
        this.router.navigate([`/forgot-password`]);
    }

    public async presentAlertConfirm(): Promise<void> {
        const alert = await this.alertController.create({
            header: 'Alert!',
            message: 'Verify Your Email prior login!',
            buttons: [
                {
                    text: 'Cancel',
                    role: 'cancel',
                    cssClass: 'secondary',
                    handler: (blah) => {
                        console.log('Confirm Cancel: blah');
                        this.auth.afAuth.signOut();
                    },
                },
                {
                    text: 'Resend verification mail',
                    handler: () => {
                        console.log('Confirm Okay');
                        this.auth.afAuth.onAuthStateChanged((user) => {
                            sendEmailVerification(user)
                                .then(() => {
                                    console.log('Please check your mail');
                                })
                                .catch((err) => {
                                    console.log('err=>', err);
                                })
                                .finally(() => {
                                    this.auth.afAuth.signOut();
                                });
                        });
                    },
                },
            ],
            backdropDismiss: false,
        });

        await alert.present();
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

    public gloginclicked(): void {
        if (!navigator.onLine) {
            this.dialog.showToast('Please check your Internet connection');
            return;
        }

        this.auth
            .googleSignin()
            .then((response) => {
                this.auth.user$.pipe(takeWhile(() => this.alive)).subscribe((u) => {
                    if (this.returnUrl) {
                        this.router.navigate([this.returnUrl]);
                    } else {
                        this.router.navigate(['/home']);
                    }
                });
            })
            .catch(async (err) => {
                if (err.code === 'auth/web-storage-unsupported') {
                    this.dialog.showToast(
                        `Browser Error: Please allow 3rd party cookies and data storage`
                    );
                } else {
                    this.dialog.showToast(`Internal Error.. ${err.message}`);
                }
                console.log('err->', err);
                logEvent(this.analytics, 'google-login-error', err);
                await this.logger.log({
                    error: err.message,
                    type: 'googleSignIn',
                    createdAt: new Date(),
                });
            });
    }

    public doRefresh(event) {
        setTimeout(() => {
            window.location.href = '#';
            event.target.complete();
        }, 1000);
    }
    /**************************************************************
     ****************Get Functions*****************************
     *************************************************************/

    get email() {
        return this.loginForm.get('email');
    }

    get password() {
        return this.loginForm.get('password');
    }
}
