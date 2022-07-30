/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/member-ordering */
import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormBuilder } from '@angular/forms';
import { Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

import { AlertController, MenuController } from '@ionic/angular';
import { takeWhile, take, finalize } from 'rxjs/operators';

import { User } from '../../common/model/user.model';
// import { Ng2ImgMaxService } from 'ng2-img-max';

import { AuthService } from '../auth.service';
import { FirestoreService } from 'src/app/common/firestore.service';
import { DialogService } from 'src/app/common/dialog.service';
import { LoggerService } from 'src/app/common/logger.service';
// import { AngularFireStorage } from '@angular/fire/storage';

import {
    getStorage,
    Storage,
    ref,
    uploadBytes,
    UploadResult,
    getDownloadURL,
} from '@angular/fire/storage';

import {
    onAuthStateChanged,
    sendEmailVerification,
} from '@angular/fire/auth';

@Component({
    selector: 'app-signup',
    templateUrl: './signup.page.html',
    styleUrls: ['./signup.page.scss'],
})
export class SignupPage implements OnInit, AfterViewInit, OnDestroy {

    public registerForm: FormGroup;
    public inviteData: User = null;
    public emailId: string = null;

    public alive = true;

    // public maxSizeLogo: number = 1 * 750 * 1024;
    // public maxSizeCover: number = 1 * 1024 * 1024;
    public withMeta = true;
    // public maxWidthLogo: number = 512;
    // public maxWidthCover: number = 1024;
    // public maxHeigthLogo: number = 512;
    // public maxHeigthCover: number = 540;
    public allowedFileExt = '(.jpe?g|.png)';
    public allowedFileTypes = '(jpe?g|png)';

    public logotempURL = '';
    public defaultLogo = 'assets/icon/user.png';
    public logoFile: any = null;

    constructor(
        private auth: AuthService,
        private formBuilder: FormBuilder,
        public router: Router,
        public alertController: AlertController,
        public menuCtrl: MenuController,
        public db: FirestoreService,
        public logger: LoggerService,
        public dialog: DialogService,
        // public storage: AngularFireStorage,
        public storage: Storage,
        // private ng2ImgMax: Ng2ImgMaxService,
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
        this.registerForm = this.formBuilder.group({
            logoURL: ['', [Validators.required]],
            name: ['', Validators.compose([Validators.required])],
            email: ['', Validators.compose([Validators.required, Validators.email])],
            password: ['', Validators.compose([Validators.required, Validators.minLength(6)])],
            repassword: ['', Validators.compose([Validators.required, Validators.minLength(6)])],
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
        const data = this.registerForm.value;

        if (!navigator.onLine) {
            await this.dialog.dismissLoader();
            this.dialog.showToast('Your network seems offline.. Please check your Internet connection');
            return;
        }

        this.uploadCover(this.logoFile)
        .then(() => {
            this.auth.registerWithEmail({
                email: this.email.value,
                password: this.password.value,
            }).then(() => {
                onAuthStateChanged(this.auth.afAuth,
                (user) => {
                    console.log('user=>', user.uid);
                    const promise1 = user ? sendEmailVerification(user) : null;
                    const promise2 = this.db.updateDocument('User', user.uid, {
                        name: this.name.value,
                        photoURL: this.logotempURL,
                    });

                    Promise.all([promise1, promise2])
                        .then(async () => {
                            await this.dialog.dismissLoader();
                            this.router.navigate([`/login`]);
                            this.presentAlert('Alert', 'Please Check Your Email');
                        })
                        .catch(async (err) => {
                            await this.dialog.dismissLoader();
                            this.presentAlert('Alert', err.message);
                            await this.logger.log({
                                error: err.message,
                                type: 'signup error',
                                createdAt: new Date(),
                            });
                        });
                },
                async (err) => {
                    await this.dialog.dismissLoader();
                    await this.logger.log({
                        error: err.message,
                        type: 'signup authchange',
                        createdAt: new Date(),
                    });
                });
            }).catch(async (err) => {
                await this.dialog.dismissLoader();
                this.presentAlert('Alert', err.message);
                await this.logger.log({
                    error: err.message,
                    type: 'register error',
                    createdAt: new Date(),
                });
            });
        }).catch(async (err) => {
            await this.dialog.dismissLoader();
            await this.dialog.showToast('Image upload failed. Try again.');
            console.log('err=>', err.message);
        });


    }

    public forgotPassword(): void {
        this.registerForm.reset();
        this.router.navigate([`/forgot-password`]);
    }

    public login(): void {
        this.registerForm.reset();
        this.router.navigate([`/login`]);
    }

    // ***** File upload functions *****

    public async onFileChanged(event: any): Promise<void> {
        this.logoURL.markAsTouched();
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];

            this.logoFile = file;
            // this.logoFile = await this.compression(file);
            console.log('this.logoFile=>', this.logoFile);

            const reader = new FileReader();
            reader.onload = e => {
                const x = reader.result as string;
                this.logotempURL = x;
            };
            reader.readAsDataURL(file);
        }
    }

    // public compression(file: File): Promise<File> {
    //     return new Promise((resolve, reject) => {
    //         this.ng2ImgMax.compressImage(file, 0.1).pipe(takeWhile(() => this.alive)).subscribe(
    //             (result: File) => {
    //                 console.log('one shot!');
    //                 resolve(result);
    //             },
    //             (err: any) => {
    //                 console.log('err=>', err);
    //                 resolve(file);
    //             });
    //     });
    // }

    public uploadCover(file: any): Promise<any> {
        if (!file) {
            console.log('No file found');
            return new Promise((resolve, reject) => {
                resolve(null);
            });
        }

        const imageName = file.name;
        const reader = new FileReader();
        return new Promise((resolve, reject) => {
            reader.readAsDataURL(file);

            reader.onload = e => {
                const filePath = `userImg/${imageName}`;
                const storage = getStorage();
                const fileRef = ref(storage,filePath);
                const task = uploadBytes(fileRef,file);

                task.then((value: UploadResult)=>{
                    getDownloadURL(fileRef).then((durl: string)=>{
                        const fname: string = durl.split(file.name)[0] + file.name + '?alt=media';
                        this.logotempURL = fname;
                        resolve(fname);
                    }).catch((downloadError)=>{
                        reject(downloadError);
                    });
                }).catch((fileError)=>{
                    reject(fileError);
                });

                // const fileRef = this.auth.storage.ref(filePath);
                // const task = this.auth.storage.upload(filePath, file);
                // task.snapshotChanges().pipe(
                //     finalize(() => {
                //         const sub = fileRef.getDownloadURL()
                //         .pipe(takeWhile(() => this.alive))
                //         .subscribe((durl: string) => {
                //             const fname = durl.split(file.name)[0] + file.name + '?alt=media';
                //             this.logotempURL = fname;
                //             resolve(fname);
                //         }, (downloadError) => {
                //             reject(downloadError);
                //         });
                //     })
                // ).pipe(takeWhile(() => this.alive))
                // .subscribe((uploadResponse) => {
                // }, (fileError) => {
                //     reject(fileError);
                // });

            };
        });
    }


    /**************************************************************
     ****************Get Functions*****************************
     *************************************************************/

    get logoURL() {
        return this.registerForm.get('logoURL');
    }

    get name() {
        return this.registerForm.get('name');
    }
    get email() {
        return this.registerForm.get('email');
    }
    get password() {
        return this.registerForm.get('password');
    }
    get repassword() {
        return this.registerForm.get('repassword');
    }
}
