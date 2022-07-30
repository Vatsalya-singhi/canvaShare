/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/member-ordering */
import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';

import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import {
  AlertController,
  MenuController,
  LoadingController,
  Platform,
  ModalController,
} from '@ionic/angular';

import { AuthService } from '../../auth/auth.service';
import { DialogService } from 'src/app/common/dialog.service';
import { PageService } from '../page.service';
import { SocketService } from 'src/app/common/socket.service';
import { LoggerService } from 'src/app/common/logger.service';

// import { AndroidPermissions } from '@ionic-native/android-permissions/ngx';
import { AndroidPermissions } from '@awesome-cordova-plugins/android-permissions/ngx';
// import { Plugins } from "@capacitor/core";
import { Subscription } from 'rxjs';
import { Capacitor } from '@capacitor/core';
// const { App, Device } = Plugins;

@Component({
  selector: 'app-front',
  templateUrl: './front.page.html',
  styleUrls: ['./front.page.scss'],
})
export class FrontPage implements OnInit, AfterViewInit, OnDestroy {
  public createForm: FormGroup;
  public joinForm: FormGroup;
  private alive = true;
  public tabFlag = true; // true-> create false->join

  public permissionList: any[] = [
    this.appPermission.PERMISSION.CAMERA,
    this.appPermission.PERMISSION.RECORD_AUDIO,
    this.appPermission.PERMISSION.MODIFY_AUDIO_SETTINGS,
    this.appPermission.PERMISSION.INTERNET,
  ];

  public sub: Subscription = null;

  constructor(
    private auth: AuthService,
    private formBuilder: FormBuilder,
    public router: Router,
    public alertController: AlertController,
    public dialog: DialogService,
    public menuCtrl: MenuController,
    public pageService: PageService,
    public socketService: SocketService,
    public logger: LoggerService,
    // public analytics: AngularFireAnalytics,
    public loadingCtrl: LoadingController,
    public appPermission: AndroidPermissions,
    private platform: Platform,
    private location: Location,
    public modalController: ModalController
  ) {
    // this.addBackButtonListener();
  }

  /**************************************************************
   ****************Lifecycle functions*****************************
   *************************************************************/

  public ngOnInit(): void {
    this.buildForm();
    this.LastRoomCheck();

    this.platform
      .ready()
      .then(async (val: string) => {
        console.log('status=>', val);
        if (
            Capacitor.isNativePlatform()
        //   this.platform.is('cordova') &&
        //   (this.platform.is('ios') || this.platform.is('android'))
        ) {
          // run native code
          const permissionResult = await this.permissionCheck();
          console.log('CHECK THIS SHIT permissionResult=>', permissionResult);
        } else {
          console.log('platform is not ios or android');
        }
      })
      .catch((err) => {
        console.log('err=>', err);
      });
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
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  /**************************************************************
   ****************Public functions*****************************
   *************************************************************/

  public buildForm(): void {
    this.createForm = this.formBuilder.group({
      name: ['', Validators.compose([Validators.required])],
      password: [
        '',
        Validators.compose([Validators.required, Validators.minLength(5)]),
      ],
      editCan: [true],
    });

    this.name.setValue(this.pageService.getUniqueGroupName());

    this.joinForm = this.formBuilder.group({
      joinName: ['', Validators.compose([Validators.required])],
      joinPassword: [
        '',
        Validators.compose([Validators.required, Validators.minLength(5)]),
      ],
      userName: ['', Validators.compose([Validators.required])],
    });

    if (this.auth.user && this.auth.user.name) {
      this.userName.setValue(this.auth.user.name);
    }
  }

  public async onCreate() {
    // await this.platform.ready();

    // if (this.platform.is('cordova') && (this.platform.is('ios') || this.platform.is('android')) ) {
    //     // run native code
    //     let permissionResult = await this.permissionCheck();
    //     console.log('CHECK THIS SHIT permissionResult=>', permissionResult);
    // } else {
    //     console.log('platform is not ios or android');
    // }

    await this.dialog.showLoader('Setting up the essentials...');

    if (!navigator.onLine) {
      this.dialog.showToast('Please check your Internet connection');
      await this.dialog.dismissLoader();
      return;
    }

    const config = this.createForm.value;
    this.socketService
      .createRoom(
        config.name,
        config.password,
        config.editCan,
        this.auth.user.id,
        this.auth.user.photoURL
      )
      .then(async (data) => {
        await this.dialog.dismissLoader();
        this.dialog.showToast(data.message);

        if (data.type === 'success') {
          this.pageService.saveRoomLocally({
            room: config.name,
            password: config.password,
          });
          this.socketService.configuration.id = data.user ? data.user.id : null;
          this.router.navigate(['/home']);
        } else {
          localStorage.removeItem('room');
        }
      })
      .catch(async (err) => {
        await this.dialog.dismissLoader();

        await this.logger.log({
          error: err.message,
          type: 'create-room',
          createdAt: new Date(),
        });
        this.dialog.showToast(err.message);
      });
  }

  public async onJoin() {
    await this.dialog.showLoader('Joining Room...');

    if (!navigator.onLine) {
      this.dialog.showToast('Please check your Internet connection');
      await this.dialog.dismissLoader();
      return;
    }

    const config = this.joinForm.value;
    this.socketService
      .joinRoom(
        config.joinName,
        config.joinPassword,
        config.userName,
        'joinee',
        this.auth.user.id,
        this.auth.user.photoURL
      )
      .then(async (data) => {
        await this.dialog.dismissLoader();
        this.dialog.showToast(data.message);
        if (data.type === 'success') {
          this.pageService.saveRoomLocally({
            room: config.joinName,
            password: config.joinPassword,
          });
          this.socketService.configuration.id = data.user ? data.user.id : null;
          this.router.navigate(['/home']);
        } else {
          localStorage.removeItem('room');
        }
      })
      .catch(async (err) => {
        await this.dialog.dismissLoader();

        await this.logger.log({
          error: err.message,
          type: 'join-room',
          createdAt: new Date(),
        });
        this.dialog.showToast(err.message);
      });
  }

  public async LastRoomCheck(): Promise<void> {
    const obj = await this.pageService.LastRoomCheck();
    if (obj == null) {
      return;
    }
    this.joinName.setValue(obj.room);
    this.joinPassword.setValue(obj.password);
    this.onJoin();
  }

  public switchtab(boolFlag: boolean): void {
    this.tabFlag = boolFlag;
  }

  public copyRoom() {
    const selBox: HTMLTextAreaElement = document.createElement('textarea');
    selBox.style.position = 'fixed';
    selBox.style.left = '0';
    selBox.style.top = '0';
    selBox.style.opacity = '0';
    selBox.textContent = this.name.value;
    document.body.appendChild(selBox);

    selBox.focus();
    selBox.select();
    document.execCommand('copy');
    document.body.removeChild(selBox);

    this.dialog.showToast('Room Details Copied!');
  }

  public async logout() {
    await this.auth.signOut();
  }

  public permissionCheck(): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        await this.platform.ready();
        const promiseArray = [];
        this.permissionList.forEach((val) => {
          promiseArray.push(this.apiRequest(val));
        });

        Promise.all(promiseArray).then((resultArray: boolean[]) => {
          // get list of permission whose result is false
          const newPermissionList: any[] = resultArray.reduce(
            (arr: any[], e: boolean, i: number) => {
              if (e === false) {arr.push(this.permissionList[i]);}
              return arr;
            },
            []
          );

          // request Permission and send back results
          this.appPermission
            .requestPermissions(newPermissionList)
            .then((result) => {
              console.log('permisson result=>', result);
              resolve(result);
            })
            .catch((err) => {
              console.log('permission err=>', err);
              reject(err);
            });
        });
      } catch (err) {
        reject(false);
      }
    });
  }

  public apiRequest(permission: any): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      try {
        const val = await this.appPermission.checkPermission(permission);
        resolve(val.hasPermission);
      } catch (err) {
        resolve(false);
      }
    });
  }

  public doRefresh(event) {
    setTimeout(() => {
      window.location.href = '#';
      event.target.complete();
    }, 1000);
  }

  public addBackButtonListener() {
    this.sub = this.platform.backButton.subscribeWithPriority(
      0,
      async (processNextHandler) => {
        // close if any alertcontroller is open
        try {
          await (await this.alertController.getTop()).dismiss();
          return;
        } catch (err) {}

        // close if any modal is open
        try {
          await (await this.modalController.getTop()).dismiss();
          return;
        } catch (err) {}

        // exit app if on landing page
        // if (this.location.isCurrentPathEqualTo("/front")) {
        //   try {
        //     if (App) {
        //       App.exitApp();
        //       console.log("app exits");
        //     }
        //   } catch (err) {}
        // }
      }
    );
  }

  /**************************************************************
   ****************Get Functions*****************************
   *************************************************************/

  get name() {
    return this.createForm.get('name');
  }

  get password() {
    return this.createForm.get('password');
  }

  get editCan() {
    return this.createForm.get('editCan');
  }

  get joinName() {
    return this.joinForm.get('joinName');
  }

  get joinPassword() {
    return this.joinForm.get('joinPassword');
  }

  get userName() {
    return this.joinForm.get('userName');
  }
}
