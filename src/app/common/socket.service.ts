/* eslint-disable no-debugger */
/* eslint-disable max-len */
import { Injectable, OnDestroy, OnInit } from '@angular/core';
// import { Socket } from 'ngx-socket-io';
import { io, SocketOptions } from 'socket.io-client';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { map, tap, takeWhile } from 'rxjs/operators';

// import * as util from 'util';

@Injectable({
    providedIn: 'root'
})

export class SocketService implements OnDestroy {

    public configuration: any = {};
    public userList$: BehaviorSubject<any[]> = new BehaviorSubject(null);
    public alive = true;

    public serverURL = 'https://canvassocketypescript.herokuapp.com';
    // public serverURL = 'http://localhost:3000';
    public socket = io(this.serverURL);


    constructor(
        // public socket: Socket, // when using ngx-socket-io
        public auth: AuthService,
    ) {
        // only testing
        // setTimeout(() => {
        //     this.setUpSocket();
        // });

        // this.auth.user$
        //     .pipe(takeWhile(() => this.alive))
        //     .subscribe(
        //         (data) => {
        //             if (this.auth.user && this.auth.user.id != null) {
        //                 try {
        //                     console.log('socket connect called');
        //                     this.socket.connect();
        //                 } catch (err) {
        //                     console.log('Error occured', err);
        //                 }
        //             }
        //         })
    }

    // public ngOnInit(): void {
    //     try {
    //         this.socket.connect();
    //         console.log('socket connect called');
    //     } catch (err) {
    //         console.log('Error occured', err);
    //     }
    // }

    public ngOnDestroy(): void {
        this.alive = false;
        this.socket.disconnect();
        this.socket.removeAllListeners();
    }

    /**
     * Emitters
     */
    public sendPoints(action: string, points: any): void {
        this.socket.emit('send-points', {
            action,
            points,
            room: this.configuration.room,
            authID: this.auth.user.id,
        });
    }

    public specialPoints(points: any, to: any, room: string): void {
        this.socket.emit('special-points', {
            action: 'special',
            points,
            to,
            room: this.configuration.room || room,
            authID: this.auth.user.id,
        });
    }

    // FRESH START
    public createRoom(roomName: string, password: string, editCan: boolean, authID: string, photoURL: string): Promise<any> {
        this.configuration = {
            username: this.auth.user.name,
            room: roomName,
            password,
            role: 'creator',
            editCan,
            authID,
            photoURL,
        };
        this.socket.emit('create-room', this.configuration);
        // return this.socket.fromOneTimeEvent('create-room-callback');
        // const socketPromise = util.promisify(this.socket.once);
        // return socketPromise('create-room-callback');
        return new Promise((resolve, reject) => {
            this.socket.once('create-room-callback', (response) => {
                resolve(response);
            });
        });
    }

    public joinRoom(roomName: string, password: string, userName: string, role: string = 'joinee', authID: string, photoURL: string): Promise<any> {
        this.configuration = {
            username: (userName && userName.length > 0) ? userName : (this.auth.user.name ? this.auth.user.name : 'New User'),
            room: roomName,
            password,
            role,
            authID,
            photoURL
        };
        this.socket.emit('join-room', this.configuration);
        // return this.socket.fromOneTimeEvent('join-room-callback');
        // const socketPromise = util.promisify(this.socket.once);
        // return socketPromise('join-room-callback');
        return new Promise((resolve, reject) => {
            this.socket.once('join-room-callback', (response) => {
                resolve(response);
            });
        });
    }

    public leaveRoom() {
        this.socket.emit('leave-room');
        localStorage.removeItem('room');
        this.configuration = {};
    }

    public updateConfig(roomName: string, id: string, editCan: boolean) { // new editCan
        const payload = {
            roomName,
            id,
            editCan,
        };
        this.socket.emit('update-config', payload);
        // return this.socket.fromOneTimeEvent('update-config-callback');
        // const socketPromise = util.promisify(this.socket.once);
        // return socketPromise('update-config-callback');
        return new Promise((resolve, reject) => {
            this.socket.once('update-config-callback', (response) => {
                resolve(response);
            });
        });
    }
    /**
     * Event Listeners
     */

    public fetchMessage(): Observable<any> {
        // return this.socket.fromEvent('message');
        // const socketPromise = util.promisify(this.socket.on);
        // return of(socketPromise('message'));
        const promise = new Promise((resolve, reject) => {
            this.socket.on('message', (response) => {
                resolve(response);
            });
        });
        return of(promise);
    }

    public roomUsers(): Observable<any> {
        // return this.socket.fromEvent('room-users');
        // const socketPromise = util.promisify(this.socket.on);
        // return of(socketPromise('room-users'));
        const promise = new Promise((resolve, reject) => {
            this.socket.on('room-users', (response) => {
                resolve(response);
            });
        });
        return of(promise);
    }

    public fetchPoints(): Observable<any> {
        // return this.socket.fromEvent('fetch-points');
        // const socketPromise = util.promisify(this.socket.on);
        // return of(socketPromise('fetch-points'));
        const promise = new Promise((resolve, reject) => {
            this.socket.on('fetch-points', (response) => {
                resolve(response);
            });
        });
        return of(promise);
    }

    public specialCall(): Observable<any> {
        // return this.socket.fromEvent('specialCall');
        // const socketPromise = util.promisify(this.socket.on);
        // return of(socketPromise('specialCall'));
        const promise = new Promise((resolve, reject) => {
            this.socket.on('specialCall', (response) => {
                resolve(response);
            });
        });
        return of(promise);
    }

    // have to use this
    public config(): Observable<any> {
        // return this.socket.fromEvent('config');
        // const socketPromise = util.promisify(this.socket.on);
        // return of(socketPromise('config'));
        const promise = new Promise((resolve, reject) => {
            this.socket.on('config', (response) => {
                resolve(response);
            });
        });
        return of(promise);
    }

    public errorCases(): Observable<any> {
        // let obs$ =  this.socket.fromEvent('error');

        // const socketPromise = util.promisify(this.socket.on);
        // const obs$ = of(socketPromise('error'));

        const promise = new Promise((resolve, reject) => {
            this.socket.on('error', (response) => {
                resolve(response);
            });
        });
        const obs$ = of(promise);

        return obs$.pipe(
            tap(str => {
                if (str === 'Room with similar name already exist..') {
                    this.configuration = {};
                }
                if (str === 'No room exists') {
                    this.configuration = {};
                }
                if (str === 'User already joined') {

                }
                console.log('str=>', str);
            })
        );
    }


    // testing was commented
    // public setUpSocket() {
    //     if (this.socket.ioSocket.disconnected) {
    //         console.log('Disconnected trying to connect back');
    //         // debugger;
    //         this.socket.connect();
    //         this.socket.on('connection',()=>{
    //             debugger;
    //             console.log('connection set up complete');
    //         });
    //     }
    // }


    /**
     * Video Functions
     */

    public sendBroadcast() {
        return this.socket.emit('broadcast', {
            room: this.configuration.room
        });
    }

    public sendWatcher(id: string) {
        return this.socket.emit('watcher', {
            id
        });
    }

    public sendCandidate(id: any, candidate: RTCIceCandidate) {
        return this.socket.emit('candidate', {
            id,
            candidate,
            // candidate : encodeURIComponent(JSON.stringify(candidate))
        });
    }

    public sendOffer(id: any, offer: RTCSessionDescription) {
        return this.socket.emit('offer', {
            id,
            offer,
            // localDescription : localDescription,
            // localDescription : encodeURIComponent(JSON.stringify(localDescription))
        });
    }

    public sendAnswer(id: any, answer: any) {
        return this.socket.emit('answer', {
            id,
            answer,
            // localDescription : encodeURIComponent(JSON.stringify(localDescription)),
        });
    }

    /**
     * Video Event Listeners
     */

    public broadcastListener(): Observable<any> {
        // return this.socket.fromEvent('broadcast');
        // const socketPromise = util.promisify(this.socket.on);
        // return of(socketPromise('broadcast'));
        const promise = new Promise((resolve, reject) => {
            this.socket.on('broadcast', (response) => {
                resolve(response);
            });
        });
        return of(promise);
    }

    public watchListener(): Observable<any> {
        // return this.socket.fromEvent('watcher');
        // const socketPromise = util.promisify(this.socket.on);
        // return of(socketPromise('watcher'));
        const promise = new Promise((resolve, reject) => {
            this.socket.on('watcher', (response) => {
                resolve(response);
            });
        });
        return of(promise);
    }

    public offerListen(): Observable<any> {
        // return this.socket.fromEvent('offer');
        // const socketPromise = util.promisify(this.socket.on);
        // return of(socketPromise('offer'));
        const promise = new Promise((resolve, reject) => {
            this.socket.on('offer', (response) => {
                resolve(response);
            });
        });
        return of(promise);
    }

    public answerListen(): Observable<any> {
        // return this.socket.fromEvent('answer');
        // const socketPromise = util.promisify(this.socket.on);
        // return of(socketPromise('answer'));
        const promise = new Promise((resolve, reject) => {
            this.socket.on('answer', (response) => {
                resolve(response);
            });
        });
        return of(promise);
    }

    public candidateListen(): Observable<any> {
        // return this.socket.fromEvent('candidate');
        // const socketPromise = util.promisify(this.socket.on);
        // return of(socketPromise('candidate'));
        const promise = new Promise((resolve, reject) => {
            this.socket.on('candidate', (response) => {
                resolve(response);
            });
        });
        return of(promise);
    }

    public disconnectPeer(): Observable<any> {
        // return this.socket.fromEvent('disconnectPeer');
        // const socketPromise = util.promisify(this.socket.on);
        // return of(socketPromise('disconnectPeer'));
        const promise = new Promise((resolve, reject) => {
            this.socket.on('disconnectPeer', (response) => {
                resolve(response);
            });
        });
        return of(promise);
    }
}
