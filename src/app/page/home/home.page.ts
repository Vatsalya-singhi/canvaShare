import { Component, AfterViewInit, ViewChild, ViewChildren, OnInit, OnDestroy } from '@angular/core';
import { Platform, PopoverController, IonRouterOutlet } from '@ionic/angular';

import { takeWhile } from 'rxjs/operators';
import { SocketService } from '../../common/socket.service';
import { DialogService } from '../../common/dialog.service';
import { Router } from '@angular/router';
import { OptionsComponent } from 'src/app/common/components/options/options.component';
import { PeopleComponent } from 'src/app/common/components/people/people.component';
import { AuthService } from 'src/app/auth/auth.service';
import { CallComponent } from 'src/app/common/components/call/call.component';
import { AbsoluteDrag } from 'src/app/common/directives/absolute-drag.directive';


// import { SocialSharing } from '@ionic-native/social-sharing/ngx';
import { SocialSharing } from '@awesome-cordova-plugins/social-sharing/ngx';


@Component({
    selector: 'app-home',
    templateUrl: 'home.page.html',
    styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit, AfterViewInit, OnDestroy {

    @ViewChild('imageCanvas', { static: false }) canvas: any;
    @ViewChild('call', { static: false }) callComponent: CallComponent;
    @ViewChild(AbsoluteDrag, { static: true }) absoluteDrag: AbsoluteDrag;

    public canvasElement: any;
    public saveX: number;
    public saveY: number;
    public canvasOffset: any;

    public selectedColor = '#9e2956';
    public colors: any[] = ['#9e2956', '#c2281d', '#de722f', '#edbf4c', '#5db37e', '#FFFFFF', '#459cde', '#4250ad', '#802fa3'];

    public drawing = false;
    public lineWidth = 5;

    public alive = true;

    public points: any[] = [];
    public subArr: any[] = [];

    public userList: any[] = [];

    public opacityLevel = 0;

    public height: number;
    public width: number;

    public callComponentVisible = true;

    // component variables
    public showBtn = false;

    // video chat variables
    public constraints: MediaStreamConstraints = {
        video: { facingMode: 'user' },
        audio: false,
    };

    // public peerConnections: any = {};
    // public connectionConfig: any = {
    //     iceServers: [
    //         {
    //             // urls: ['stun:stun.l.google.com:19302'], // currently used
    //             urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'], // testing
    //         },
    //     ],
    //     iceCandidatePoolSize: 10,
    // };
    // public peerConnection: any;
    public userVideo: HTMLMediaElement;

    constructor(
        private plt: Platform,
        public socket: SocketService,
        public dialog: DialogService,
        private router: Router,
        public popoverCtrl: PopoverController,
        public auth: AuthService,

        private routerOutlet: IonRouterOutlet,
        public socialSharing: SocialSharing,
    ) {

        this.startSocketListening();
    }

    /**
     * Lifecycle Functions
     */

    public ionViewWillEnter() {
        // disable back button on page enter
        this.routerOutlet.swipeGesture = false;
    }

    public ionViewWillLeave() {
        // enable back button on page exit
        this.routerOutlet.swipeGesture = true;
    }

    public ngOnInit() {
        // handle back button event
        this.routerOutlet.swipeGesture = false;
        this.plt.backButton.
            subscribeWithPriority(10,
                async (processNextHandler) => {
                    console.log('Back press handler!');
                    console.log('Show Exit Alert!');
                    await this.leaveRoom();
                    processNextHandler();
                });

        document.addEventListener('ionBackButton', (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            console.log('back button trigger called', ev.type);
            this.leaveRoom();
        });

        // start user stream
        this.userVideo = (document.getElementById('userVideo') as HTMLMediaElement);
        navigator.mediaDevices.getUserMedia(this.constraints)
        .then((stream: MediaStream) => {
                this.userVideo.srcObject = stream;
                this.userVideo.onloadedmetadata = (e)=>{
                    this.userVideo.play();
                };
            }).catch((error: any) => {
                console.log('error=>', error);
            });
    }

    public ngAfterViewInit(): void {
        // make canvas responsive
        this.setDimensions();
        this.plt.resize.pipe(takeWhile(() => this.alive)).subscribe(() => {
            this.setDimensions();
            this.redrawAll();
        });
    }

    public ngOnDestroy(): void {
        // enable back button
        this.routerOutlet.swipeGesture = true;
    }


    /**
     * Primary Functions
     */

    public startDrawing(ev: any): void {

        //check if user can edit
        if (this.socket.configuration && !this.socket.configuration.editCan && this.socket.configuration.role === 'joinee') {
            this.dialog.showToast('User doesn\'t have edit access..');
            return;
        }

        // reset subArr
        this.subArr = [];

        this.drawing = true;
        const canvasPosition = this.canvasElement.getBoundingClientRect();

        // mouse event
        if (ev.type && (ev.type as string).indexOf('mouse') !== -1) {
            this.saveX = ev.pageX - canvasPosition.x;
            this.saveY = ev.pageY - canvasPosition.y;
        }

        // touch event
        if (ev.type && (ev.type as string).indexOf('touch') !== -1) {
            this.saveX = ev.touches[0].pageX - canvasPosition.x;
            this.saveY = ev.touches[0].pageY - canvasPosition.y;
        }

        this.subArr.push({
            lineWidth: this.lineWidth,
            color: this.selectedColor,
            mode: 'start',
            x: this.saveX,
            y: this.saveY,
            height: this.plt.height(),
            width: this.plt.width()
        });

    }

    public endDrawing(ev: any): void {
        //check if user can edit
        if (this.socket.configuration && !this.socket.configuration.editCan && this.socket.configuration.role === 'joinee') {
            // this.dialog.showToast('User doesn\'t have edit access..');
            return;
        }

        this.drawing = false;

        this.subArr.push({
            lineWidth: this.lineWidth,
            color: this.selectedColor,
            mode: 'end',
            x: this.saveX,
            y: this.saveY,
            height: this.plt.height(),
            width: this.plt.width()
        });

        this.points.push(this.subArr);

        this.sendPoints('send subArr');
        console.log('Points sent!');
    }

    public moved(ev: any): void {
        //check if user can edit
        if (this.socket.configuration && !this.socket.configuration.editCan && this.socket.configuration.role === 'joinee') {
            // this.dialog.showToast('User doesn\'t have edit access..');
            return;
        }

        if (!this.drawing) {return;}

        const canvasPosition = this.canvasElement.getBoundingClientRect();
        const ctx = this.canvasElement.getContext('2d');
        let currentX;
        let currentY;
        // mouse event
        if (ev.type && (ev.type as string).indexOf('mouse') !== -1) {
            currentX = ev.pageX - canvasPosition.x;
            currentY = ev.pageY - canvasPosition.y;
        }

        // touch event
        if (ev.type && (ev.type as string).indexOf('touch') !== -1) {
            currentX = ev.touches[0].pageX - canvasPosition.x;
            currentY = ev.touches[0].pageY - canvasPosition.y;
        }

        ctx.lineJoin = 'round';
        ctx.strokeStyle = this.selectedColor;
        ctx.lineWidth = this.lineWidth;

        ctx.beginPath();
        ctx.moveTo(this.saveX, this.saveY);
        ctx.lineTo(currentX, currentY);
        ctx.closePath();

        ctx.stroke();

        this.saveX = currentX;
        this.saveY = currentY;

        console.log('move=>', this.saveX, this.saveY);
        this.subArr.push({
            lineWidth: this.lineWidth,
            color: this.selectedColor,
            mode: 'draw',
            x: this.saveX,
            y: this.saveY,
            height: this.plt.height(),
            width: this.plt.width()
        });
    }

    public redrawAll(limit: number = this.points.length) {

        this.resetCanvas();

        if (limit === 0) {
            return;
        }

        const ctx = this.canvasElement.getContext('2d');

        for (let j = 0; j < limit; j++) {
            const subArray = this.points[j];

            for (let i = 0; i < subArray.length; i++) {
                const pt = subArray[i];
                // set scale
                const xval = Number(this.plt.height() / pt.height);
                const yval = Number(this.plt.width() / pt.width);
                ctx.scale(yval, xval);

                let begin = false;

                if (ctx.lineWidth !== pt.lineWidth) {
                    ctx.lineWidth = pt.lineWidth;
                    begin = true;
                }

                if (ctx.strokeStyle !== pt.color) {
                    ctx.strokeStyle = pt.color;
                    begin = true;
                }

                if (pt.mode === 'start' || begin) {
                    ctx.beginPath();
                    ctx.moveTo(pt.x, pt.y);
                }

                ctx.lineTo(pt.x, pt.y);

                if (pt.mode === 'end' || (i === subArray.length - 1)) {
                    ctx.stroke();
                }

                // restore
                ctx.scale(1 / yval, 1 / xval);
            }
            ctx.stroke();
        }

    }

    /**
     * Secondary Functions
     */

    public setDimensions(): void {
        this.canvasElement = this.canvas.nativeElement;
        this.canvasElement.width = this.plt.width() + '';
        this.canvasElement.height = (0.70 * this.plt.height()) + '';

        this.height = this.plt.height();
        this.width = this.plt.width();
    }

    public resetCanvas() {
        const context = this.canvasElement.getContext('2d');
        context.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
    }

    public async confirmAndResetCanvas(): Promise<void> {
        //check if user can edit
        if (this.socket.configuration && !this.socket.configuration.editCan && this.socket.configuration.role === 'joinee') {
            this.dialog.showToast('User doesn\'t have edit access..');
            return;
        }

        const context = this.canvasElement.getContext('2d');
        const confirmation = await this.dialog.askConfirmation('This action is irreversible.. Do you want to still continue?');
        if (confirmation && confirmation.role === 'Yes') {
            context.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
            this.sendPoints('reset');
        }
    }

    public async undo() {
        //check if user can edit
        if (this.socket.configuration && !this.socket.configuration.editCan && this.socket.configuration.role === 'joinee') {
            this.dialog.showToast('User doesn\'t have edit access..');
            return;
        }

        this.sendPoints('undo');
    }

    public async sendPoints(action: string): Promise<void> {
        //check if user can edit
        if (this.socket.configuration && !this.socket.configuration.editCan && this.socket.configuration.role === 'joinee') {
            return;
        }

        if (action === 'send subArr') {
            this.socket.sendPoints(action, this.subArr);
            this.showSending();
        }
        if (action === 'reset') {
            await this.dialog.showLoader('Please Wait...', 2000);
            this.socket.sendPoints(action, null);
            this.showSending();
            await this.dialog.dismissLoader();
        }
        if (action === 'undo') {
            await this.dialog.showLoader('Please Wait...', 1000);
            this.socket.sendPoints(action, null);
            this.showSending();
            await this.dialog.dismissLoader();
        }
    }

    public startSocketListening(): void {

        // fetchMessage
        this.socket.fetchMessage().pipe(takeWhile(() => this.alive)).subscribe(async (data: any) => {
            console.log('fetchMessage=>', data);
            await this.dialog.showToast(data.message);

            if (data.type === 'welcome-message') {

            }
            if (data.type === 'user-joined-message') {
                // do video call logic
            }
            if (data.type === 'user-left-message') {
                // do video call logic
            }
        });

        // fetchPoints
        this.socket.fetchPoints().pipe(takeWhile(() => this.alive)).subscribe((data: any) => {
            console.log('fetchPoints=>', data);

            if (data.action === 'send subArr') {
                if (data.points && JSON.stringify(data.points) !== JSON.stringify(this.points[this.points.length - 1])) {
                    this.points.push(data.points);
                    this.redrawAll();
                }
            }

            if (data.action === 'reset') {
                this.points = [];
                this.redrawAll();

            }
            if (data.action === 'undo') {
                this.points.pop();
                this.redrawAll();
            }

            if (data.action === 'special') {
                if (JSON.stringify(data.points) !== JSON.stringify(this.points)) {

                    // insert all the points in the starting
                    while ((data.points as []).length > 0) {
                        const sub = (data.points as []).pop();
                        this.points.unshift(sub);
                    }
                    this.redrawAll();
                }
            }
        });

        // roomUsers
        this.socket.roomUsers().pipe(takeWhile(() => this.alive)).subscribe((userList) => {
            console.log('roomUsers=>', userList);
            if (userList && userList.users) {
                this.userList = userList.users;
                this.socket.userList$.next(userList.users);

                // update socket config
                const arr: any[] = userList.users;

                const userObject = arr.find((user) => user.authID === this.auth.user.id);

                if (userObject) {
                    this.socket.configuration.editCan = userObject.editCan;
                    this.socket.configuration.role = userObject.role;
                }

            }
        });

        // Config
        this.socket.config().pipe(takeWhile(() => this.alive)).subscribe((userObject: any) => {
            console.log('config object=>', userObject);
            if (userObject) {
                this.socket.configuration.editCan = userObject.editCan;
                this.socket.configuration.role = userObject.role;

                if (this.socket.configuration.editCan) {
                    this.dialog.showToast('User granted access !');
                } else {
                    this.dialog.showToast('User access now revoked !');
                }
            }
        });

        // specialCall
        this.socket.specialCall().pipe(takeWhile(() => this.alive)).subscribe((specialCall: any) => {
            console.log('specialCall=>', specialCall);
            if (specialCall) {
                this.socket.specialPoints(this.points, specialCall.to, specialCall.room);
            }
        });
    }

    public showSending(): void {

        const x = setInterval(() => {
            if (this.opacityLevel === 1) {
                this.opacityLevel = 0;
            } else {
                this.opacityLevel = 1;
            }
        }, 500);

        setTimeout(() => {
            clearInterval(x);
            this.opacityLevel = 0;
        }, 3000);
    }

    /**
     * TOP OPTION LIST
     */

    public async leaveRoom() {
        const confirmation = await this.dialog.askConfirmation('Do you want to leave this room ?');
        if (confirmation && confirmation.role === 'Yes') {

            // stop streaming
            await this.callComponent.haltAllServices().then((val) => {
                console.log('val=>', val);
                this.socket.leaveRoom();
                this.router.navigate([`/front`]);
            }).catch((err) => {
                console.log('err=>', err);
            });


        }
    }

    public async showOption() {
        const popover = this.popoverCtrl.create({
            component: OptionsComponent,
            componentProps: {
                selectedColor: this.selectedColor,
                lineWidth: this.lineWidth,
            },
        });

        (await popover).present();

        const output = await (await popover).onDidDismiss();
        if (output && output.role === 'submit') {
            this.lineWidth = output.data.lineWidth;
            this.selectedColor = output.data.selectedColor;
        }
    }

    public async people() {
        const popover = this.popoverCtrl.create({
            component: PeopleComponent,
            componentProps: {
                userList: this.userList,
            },
            // cssClass: []
        });

        (await popover).present();

        const output = await (await popover).onDidDismiss();
    }

    public async share() {
        console.log('this.config=>', this.socket.configuration);
        const str = `Hi join this room! \n Room Name : ${this.socket.configuration.room} \n password:${this.socket.configuration.password}`;

        if (this.plt.is('cordova') && (this.plt.is('ios') || this.plt.is('android'))) {
            // run native code
            await this.socialSharing.share(str);
            return;
        }

        const selBox: HTMLTextAreaElement = document.createElement('textarea');
        selBox.style.position = 'fixed';
        selBox.style.left = '0';
        selBox.style.top = '0';
        selBox.style.opacity = '0';
        selBox.textContent = str;
        document.body.appendChild(selBox);

        selBox.focus();
        selBox.select();
        document.execCommand('copy');
        document.body.removeChild(selBox);

        this.dialog.showToast('Room Details Copied!');
    }

    public updateTimeline($event) {
        const index = $event.detail.value;
        console.log(index);
        if (index >= 0) {
            this.redrawAll(index);
        }
    }

    public toggleVideo() {
        this.callComponentVisible = !this.callComponentVisible;
        if (!this.callComponentVisible) {
            this.dialog.showToast('Video control is now hidden');
        } else {
            this.dialog.showToast('Video control is now visible');
        }
    }

    /**
     * secondary functions
     */

    public showExpand() {
        console.log('home showExpand called');
        this.callComponent.showExpand();
        // this.showBtn = true;
    }

    public minimize() {
        console.log('this.absoluteDrag=>', this.absoluteDrag);
        if (this.absoluteDrag) {
            // this.showBtn = false;
            this.callComponent.hideExpand();

            console.log('minimize called');
            this.absoluteDrag.createCallBox();
            this.absoluteDrag.minimize();
        }
    }

}
