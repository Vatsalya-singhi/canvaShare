/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable no-throw-literal */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/prefer-for-of */
import { Component, Output, EventEmitter, AfterViewInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { SocketService } from '../../socket.service';
import { takeWhile } from 'rxjs/internal/operators/takeWhile';

import { SwiperOptions } from 'swiper';
@Component({
    selector: 'app-call',
    templateUrl: './call.component.html',
    styleUrls: ['./call.component.scss'],
})
export class CallComponent implements AfterViewInit, OnDestroy {

    @Output() minimizeEmit: EventEmitter<any> = new EventEmitter();

    public alive = true;
    public localStream: MediaStream;
    // component variables
    public showBtn = false;
    // public micFlag = true;
    public micFlag = false;
    public camFlag = true;
    public camSide = 'user';

    public offerOptions: RTCOfferOptions = {
        iceRestart: true,
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
    };

    public peerConnections: peerConnectionInterface = {};

    public connectionConfig: any = {
        iceServers: [
            {
                urls: [
                    'stun:stun.l.google.com:19302',
                    'stun:stun1.l.google.com:19302',
                    'stun:stun2.l.google.com:19302',
                    'stun:stun3.l.google.com:19302',
                    'stun:stun4.l.google.com:19302',
                    // commented below for testing
                    // 'stun:stun.ekiga.net',
                    // 'stun:stun.ideasip.com',
                    // 'stun:stun.rixtelecom.se',
                    // 'stun:stun.schlund.de',
                    // 'stun:stun.stunprotocol.org:3478',
                    // 'stun:stun.voiparound.com',
                    // 'stun:stun.voipbuster.com',
                    // 'stun:stun.voipstunt.com',
                    // 'stun:stun.voxgratia.org'
                ]
            },
        ],
        iceCandidatePoolSize: 10,
    };

    public ionSliderElement: HTMLElement;
    public userVideo: HTMLMediaElement;
    public otherVideo1: HTMLMediaElement;

    public audioSelect: HTMLMediaElement;
    public videoSelect: HTMLMediaElement;
    public audioOptions: any[] = [];
    public videoOptions: any[] = [];
    public audioSource: any = null;
    public videoSource: any = null;

    public slideOpts: SwiperOptions = {
        // initialSlide: 0,
        // slidesPerView: 3,
        // spaceBetween: 50,
        speed: 400,
        direction: 'horizontal',
        pagination: { clickable: true },
        scrollbar: { draggable: true },
        centeredSlides: true,
        autoplay: {
            delay: 2500,
            disableOnInteraction: false,
        },
        // loop : true,
        // virtual: true,
    };

    public idList: string[] = [];


    constructor(
        public socket: SocketService,
        public cdr: ChangeDetectorRef,
    ) {
        (navigator as any).getUserMedia = (navigator as any).getUserMedia || (navigator as any).webkitGetUserMedia || (navigator as any).mozGetUserMedia || (navigator as any).msGetUserMedia;

        //invoke all listeners
        this.broadcastListen();
        this.watchListener();
        this.offerListener();
        this.answerListen();
        this.candidateListen();
        this.disconnectPeer();
    }

    public ngAfterViewInit(): void {

        this.audioSelect = (document.getElementById('audioSource') as HTMLMediaElement);
        this.videoSelect = (document.getElementById('videoSource') as HTMLMediaElement);
        this.userVideo = (document.getElementById('userVideo') as HTMLMediaElement);

        this.userVideo.muted = true;

        this.userVideo.autoplay = true;

        this.getStream(false)
            .then((bool: boolean) => {
                this.socket.sendBroadcast();
                return this.getDevices();
            })
            .then(this.gotDevices)
            .catch((err) => {
                console.log('err=>', err);
            });
    }

    public ngOnDestroy(): void {
        this.alive = false;
    }

    public broadcastListen() {
        this.socket.broadcastListener()
            .pipe(takeWhile(() => this.alive))
            .subscribe(({ id }: any) => {
                if (id === this.socket.configuration.id) {
                    console.log('same socket id');
                } else {
                    this.socket.sendWatcher(id); //sending joinee id back
                }
            }, (err) => {
                console.log('err=>', err);
            });
    }

    public watchListener() {
        this.socket.watchListener()
            .pipe(takeWhile(() => this.alive))
            .subscribe(async ({ id }: any) => {
                // aka existing room member ID and not newly joined ID

                this.peerConnections[id] = new RTCPeerConnection(this.connectionConfig);

                //new video element
                const otherVidElement: HTMLMediaElement = await this.createNewElementPromise(id);

                if (!otherVidElement || otherVidElement == null) {
                    console.log('otherVidElement not created');
                }

                // add iceCandidate Listener and sending method
                this.peerConnections[id].onicecandidate = (event: RTCPeerConnectionIceEvent) => this.onicecandidateListener(event, id);

                // log connection state
                this.peerConnections[id].oniceconnectionstatechange = (event: Event) => {
                    if (this.peerConnections[id]) {
                        console.log('iceConnectionState=>', this.peerConnections[id].iceConnectionState);
                        console.log('connectionState=>', this.peerConnections[id].connectionState);
                    }
                };

                //Wait for their video stream
                this.peerConnections[id].ontrack = (event: RTCTrackEvent) => {
                    if (otherVidElement) {

                        console.log('event.streams=>', event.streams);
                        if (!otherVidElement.srcObject) {
                            otherVidElement.srcObject = event.streams[0];
                        }

                        event.track.onended = (event: Event) => {
                            console.log('track ended!');
                            otherVidElement.srcObject = otherVidElement.srcObject;
                        };
                    }
                };

                // sent offer on negotiate
                this.peerConnections[id].onnegotiationneeded = (event: Event) => {
                    if (this.peerConnections[id].iceConnectionState !== 'completed' || this.peerConnections[id].connectionState === 'failed') {
                        this.getUserMediaAndCallSendOfferFunc(id);
                    }
                };

                this.getUserMediaAndCallSendOfferFunc(id);

            }, (err) => {
                console.log('err=>', err);
            });
    }

    public getUserMediaAndCallSendOfferFunc(id: string) {
        this.getUserMediaCommonFunctionCall(id, 1)
            .then(() => {
                console.log('stream added');
            }).catch((err) => {
                console.log('err=>', err);
            }).finally(() => {
                this.createAndSendOffer(id);
            });
    }

    public createAndSendOffer(id: string) {
        this.peerConnections[id]
            .createOffer(this.offerOptions)
            .then(async (offer: RTCSessionDescriptionInit) => {
                if (this.peerConnections[id].signalingState !== 'stable') {
                    console.log('-- The connection isn\'t stable yet; postponing...');
                    return;
                }

                this.peerConnections[id].setLocalDescription(offer).then(() => {
                    console.log('sending Offer');
                    this.socket.sendOffer(id, this.peerConnections[id].localDescription);
                }).catch((err) => {
                    console.log('local desc was not set & offer not sent');
                });
            }, (err) => {
                console.log('offer not created=>', err);
            });
    }

    public offerListener() {
        this.socket.offerListen()
            .pipe(takeWhile(() => this.alive))
            .subscribe(async (data) => {
                const id: string = data.id;
                const offer: RTCSessionDescription = data.offer;

                if (!this.peerConnections[id] || this.peerConnections[id] == null) {
                    this.peerConnections[id] = new RTCPeerConnection(this.connectionConfig);
                }

                //new video element
                const otherVidElement: HTMLMediaElement = await this.createNewElementPromise(id);

                if (!otherVidElement || otherVidElement == null) {
                    console.log('otherVidElement not created');
                }

                this.peerConnections[id]
                    .setRemoteDescription(offer)
                    .then(() => this.getUserMediaCommonFunctionCall(id, 2))
                    .then((stream: MediaStream) => {
                        this.userVideo.srcObject = stream;
                    })
                    .then(() => {
                        if (!this.peerConnections[id].localDescription || this.peerConnections[id].localDescription == null) {
                            return this.peerConnections[id].createAnswer();
                        }
                        throw 'answer created already';
                    })
                    .then((answer: RTCSessionDescriptionInit) => this.peerConnections[id].setLocalDescription(answer))
                    .then(() => {
                        console.log('sending Answer');
                        this.socket.sendAnswer(id, this.peerConnections[id].localDescription);
                    })
                    .catch((err) => {
                        console.error('err=>', err);
                    });


                this.peerConnections[id].ontrack = (event: RTCTrackEvent) => {
                    if (otherVidElement) {
                        console.log('event.streams=>', event.streams);
                        if (!otherVidElement.srcObject) {
                            otherVidElement.srcObject = event.streams[0];
                        }

                        event.track.onended = (event: Event) => {
                            console.log('track ended!');
                            otherVidElement.srcObject = otherVidElement.srcObject;
                        };
                    } else {
                        console.log('othervideo1 html tag not found');
                    }
                };

                // log connection state
                this.peerConnections[id].oniceconnectionstatechange = (event: Event) => {
                    if (this.peerConnections[id]) {
                        console.log('iceConnectionState=>', this.peerConnections[id].iceConnectionState);
                    }
                };

                // onicecandidate listener send candidate
                this.peerConnections[id].onicecandidate = (event: RTCPeerConnectionIceEvent) => this.onicecandidateListener(event, id);

            }, (err) => {
                console.log('err=>', err);
            });

    }

    public answerListen() {
        this.socket.answerListen()
            .pipe(takeWhile(() => this.alive))
            .subscribe((data: any) => {
                const id: string = data.id;
                const answer: RTCSessionDescriptionInit = data.answer;

                if (!this.peerConnections[id] || this.peerConnections[id] == null) {
                    return;
                }

                this.peerConnections[id].setRemoteDescription(answer)
                    .then(() => {
                        console.log('got answer and remote description set');
                    }).catch((err) => {
                        console.log('err=>', err);
                    });

            }, (err) => {
                console.log('err=>', err);
            });
    }

    public candidateListen() {
        this.socket.candidateListen()
            .pipe(takeWhile(() => this.alive))
            .subscribe((data) => {
                try {
                    const id: string = data.id;
                    const candidate: RTCIceCandidate = new RTCIceCandidate(data.candidate);

                    if (!this.peerConnections[id] || this.peerConnections[id] == null) {
                        this.peerConnections[id] = new RTCPeerConnection(this.connectionConfig);
                    }

                    this.peerConnections[id].addIceCandidate(candidate)
                        .then(() => {
                            console.log('addIceCandidate success');
                        }).catch((err) => {
                            console.log('addIceCandidate=>', err);
                        });
                } catch (err) {
                    console.log('icecandidate err');
                }

            }, (err) => {
                console.log('err=>', err);
            });
    }

    public onicecandidateListener(event: RTCPeerConnectionIceEvent, id: string) {
        this.socket.sendCandidate(id, event.candidate);
        // if (event.candidate && event.candidate.sdpMid && event.candidate.sdpMLineIndex) {
        //     this.socket.sendCandidate(id, event.candidate);
        // } else {
        //     console.log('candidate not sent');
        // }
    }

    public disconnectPeer() {
        this.socket.disconnectPeer()
            .pipe(takeWhile(() => this.alive))
            .subscribe((data) => {
                const id = data;
                if (this.peerConnections[id]) {
                    this.peerConnections[id].close();
                    this.peerConnections[id] = null;
                    delete this.peerConnections[id];
                    console.log('peerConnections=>', this.peerConnections);

                    this.idList = this.idList.filter((idVal) => idVal !== id);
                    console.log('this.idList=>', this.idList);
                    // remove element
                    const slideParent: HTMLElement = (document.getElementById(id).parentElement);
                    if (slideParent) {
                        slideParent.remove();
                        console.log('slideParent removeed');
                    } else {
                        console.log('slideParent not found');
                    }
                }
            }, (err) => {
                console.log('err=>', err);
            });
    }

    /**
     * PRIORITY 2 functions
     */

    public toggleMic() {
        this.micFlag = !this.micFlag;
        this.getStream()
            .then((val) => {
                console.log('mic toggle');
            }).catch(() => {
            });
    }

    public toggleCam() {
        this.camFlag = !this.camFlag;
        // (this.userVideo.srcObject as MediaStream).getTracks().map(t => t.stop());
        this.getStream()
            .then((val) => {
                console.log('cam toggle');
            }).catch((err) => {
                console.log('err=>', err);
            });
    }

    public reverseCam() {
        this.camSide = (this.camSide === 'user') ? 'environment' : 'user';
        // (this.userVideo.srcObject as MediaStream).getTracks().map(t => t.stop());
        this.getStream()
            .then((val) => {
                console.log('cam reverse');
            }).catch((err) => {
                console.log('err=>', err);
            });
    }

    // MAIN FUNCTION
    public getStream(stopStreamFlag: boolean = true): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (stopStreamFlag) {
                this.stopUserStream();
            }

            this.getUserMediaCommonFunctionCall('', 3).then(() => {
                console.log('success');
                resolve(true);
            }).catch((err) => {
                console.log('fail=>', err);
                reject(false);
            });
        });
    }

    // stop user side streaming
    public stopUserStream(): void {
        this.userVideo.pause();
        this.userVideo.src = '';
        if (this.localStream) {
            this.localStream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
        }
        (this.userVideo.srcObject as MediaStream) = null;
        this.localStream = null;
    }

    public getUserMediaCommonFunctionCall(id: string, flag: number): Promise<MediaStream | any> {
        return new Promise(async (resolve, reject) => {
            navigator.mediaDevices.getUserMedia(this.getMediaConstaint())
                .then(async (stream: MediaStream) => {
                    this.localStream = stream;
                    console.log('streamID=>', stream.id);

                    if (flag === 1 || flag === 3) {

                        if (flag === 3) {
                            try {
                                if (this.userVideo) {
                                    this.userVideo.srcObject = null;
                                    this.userVideo.srcObject = stream;
                                    await this.userVideo.play();
                                }
                            } catch (err) {
                                console.log('err=>', err);
                                reject(err);
                            }
                        }
                    }

                    const videotrack = this.localStream.getVideoTracks();
                    const audiotrack = this.localStream.getAudioTracks();

                    if (videotrack && videotrack.length > 0) {
                        videotrack[0].enabled = this.camFlag;
                    }
                    if (audiotrack && audiotrack.length > 0) {
                        audiotrack[0].enabled = this.micFlag;
                    }

                    this.localStream.getTracks().forEach(
                        async (track: MediaStreamTrack) => {
                            console.log('track data=>', track.id, track.kind, track.enabled);

                            if (track.kind === 'video') {
                                track.enabled = this.camFlag;
                            } else {
                                track.enabled = this.micFlag;
                            }

                            if (id === '') {
                                Object.keys(this.peerConnections).forEach(async (idx: string) => {
                                    await this.peerConnectionTrackUpdate(track, idx);
                                });
                            } else {
                                await this.peerConnectionTrackUpdate(track, id);
                            }
                        });
                    resolve(this.localStream);
                }).catch((err) => {

                    this.localStream = null;

                    if (flag === 1 || flag === 3) {
                        if (flag === 1 && this.userVideo) {
                            this.userVideo.srcObject = null;
                            this.userVideo.pause();
                        }
                        resolve(err);
                    }
                    reject(err);
                });
        });

    }

    public peerConnectionTrackUpdate(track: MediaStreamTrack, id: string) {
        return new Promise<void>((resolve, reject) => {
            try {
                // this.peerConnections[id].addTrack(track, this.localStream);
                const senderList: RTCRtpSender[] = this.peerConnections[id].getSenders();
                const foundIndex = senderList.findIndex((sender) => sender.track && sender.track.kind === track.kind);
                if (foundIndex !== -1) {
                    senderList[foundIndex].track.enabled = (track.kind === 'video') ? this.camFlag : this.micFlag;
                    senderList[foundIndex].replaceTrack(track);
                } else {
                    this.peerConnections[id].addTrack(track, this.localStream);
                }
                resolve();
            } catch (err) {
                console.log('err', err);
                reject();
            }
        });
    }

    public getMediaConstaint(): MediaStreamConstraints {
        const videoVal = this.camFlag ? {
            deviceId: (this.videoSource) ? this.videoSource : undefined,
            facingMode: this.camSide,
            // width: { min: 144, max: 480, ideal: 360 },
            height: { min: 144, max: 360, ideal: 360 },
            frameRate: {
                ideal: 10,
                min: 5,
            },
            noiseSuppression: true,
        } : false;

        const audioVal = this.micFlag ? {
            deviceId: (this.audioSource) ? this.audioSource : undefined,
            echoCancellation: true // checkAlphaBeta
        } : false;

        const constraints: MediaStreamConstraints = {
            video: videoVal,
            audio: audioVal,
        };

        return constraints;
    }

    /**
     * RESET FUNCTIONS
     */


    public haltAllServices(): Promise<string> {
        return new Promise((resolve, reject) => {
            try {
                Object.keys(this.peerConnections).forEach((id: string, index: number) => {
                    this.peerConnections[id].close();
                    this.peerConnections[id] = null;
                    delete this.peerConnections[id];
                });
                console.log('peerConnections=>', this.peerConnections);
                this.stopUserStream();
                this.stopOtherStreams();
                resolve('SUCCESS');
            } catch (err) {
                reject('ERROR');
            }
        });
    }

    public stopOtherStreams(): void {
        // new
        const otherVideoList: HTMLCollectionOf<HTMLMediaElement> = (document.getElementById('slides').getElementsByClassName('video') as HTMLCollectionOf<HTMLMediaElement>);
        if (otherVideoList.length > 0) {
            for (let i = 0; i < otherVideoList.length; i++) {
                const otherVideo: HTMLMediaElement = otherVideoList[i];
                otherVideo.pause();
                otherVideo.src = '';
                (otherVideo.srcObject as MediaStream) = null;
                const stream = (otherVideo.srcObject as MediaStream);
                if (stream != null) {
                    stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
                }
            }
        }
    }





    /**
     * EXPERIMENTAL
     */

    // get video and audio device list connected to system
    public gotDevices = (deviceInfos: MediaDeviceInfo[]): void => {
        (window as any).deviceInfos = deviceInfos;
        for (const [index, deviceInfo] of deviceInfos.entries()) {
            const item: any = {};
            item.value = deviceInfo.deviceId;

            if (deviceInfo.kind === 'audioinput') {
                item.text = `Microphone ${index + 1}`;
                // item.text = (deviceInfo && deviceInfo.label) ? deviceInfo.label : `Microphone ${index + 1}`;
                this.audioOptions.push(item);
            } else if (deviceInfo.kind === 'videoinput') {
                item.text = `Camera ${index + 1}`;
                // item.text = (deviceInfo && deviceInfo.label) ? deviceInfo.label : `Camera ${index + 1}`;
                this.videoOptions.push(item);
            }
        }
    };

    /**
     * PRIORITY 3 FUNCTIONS
     */

    // function call to get mediaDevice info
    public getDevices = (): Promise<MediaDeviceInfo[]> => navigator.mediaDevices.enumerateDevices();

    public showExpand() {
        this.showBtn = true;
    }

    public hideExpand() {
        this.showBtn = false;
    }

    public minimize() {
        console.log('this.peerConnections=>', this.peerConnections);
        this.minimizeEmit.emit();
    }

    public createNewElementPromise(id: string): Promise<HTMLMediaElement> {
        return new Promise((resolve, reject) => {
            if (this.idList.indexOf(id) === -1) {
                this.idList.push(id);
                console.log('idList=>', this.idList);
            }
            this.detect();
            setTimeout(() => {
                const element: HTMLMediaElement = (document.getElementById(id) as HTMLMediaElement) ?? null;
                if (element) {
                    element.muted = false;
                    element.autoplay = true;
                }
                resolve(element);
            }, 3000);
        });
    }

    public trackById(index: number, item: string) {
        return item;
    }

    public detect() {
        try {
            this.cdr.markForCheck();
            this.cdr.detectChanges();
        } catch (err) { }
    }

}

export interface peerConnectionInterface {
    [key: string]: RTCPeerConnection;
}
