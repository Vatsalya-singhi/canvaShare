import { Injectable } from '@angular/core';
import { ToastController, AlertController, LoadingController } from '@ionic/angular';

import { OverlayEventDetail } from '@ionic/core';
@Injectable({
    providedIn: 'root'
})
export class DialogService {

    // public loading: any;

    constructor(
        private toastCtrl: ToastController,
        public alertController: AlertController,
        private loadingController: LoadingController
    ) {

    }

    public async showToast(msg: string): Promise<any> {
        const toast = await this.toastCtrl.create({
            message: msg,
            position: 'bottom',
            duration: 2000
        });
        await toast.present();
        return await toast.onDidDismiss();
    }


    public async askConfirmation(message: string): Promise<OverlayEventDetail<any>> {
        const alert = await this.alertController.create({
            header: 'Alert!',
            message,
            buttons: [
                {
                    text: 'Cancel',
                    role: 'cancel',
                    cssClass: 'secondary',
                    handler: (blah) => {
                        console.log('Confirm Cancel: blah');
                        return false;
                    }
                }, {
                    text: 'Yes',
                    role: 'Yes',
                    handler: () => true
                }
            ],
            backdropDismiss: false,
        });

        await alert.present();

        return alert.onDidDismiss().then((data) => {
            console.log('alert data=>', data);
            return data;
        });
    }

    public async showLoader(message: string = null, duration: number = null): Promise<void> {
        const loading = await this.loadingController.create({
            message,
            duration,
            translucent: true,
            animated: true,
            spinner: 'bubbles',//"bubbles"
        });
        return await loading.present();
    }

    public async dismissLoader(): Promise<void> {
        setTimeout(async () => {
            try {
                const x = await this.loadingController.getTop();
                if (x) {
                    await this.loadingController.dismiss();
                }
            } catch (err) {
                console.log(err);
            }
        });
    }

}
