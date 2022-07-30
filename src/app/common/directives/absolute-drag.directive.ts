/* eslint-disable @angular-eslint/directive-selector */
/* eslint-disable @angular-eslint/directive-class-suffix */
/* eslint-disable max-len */
import { Directive, Input, ElementRef, Renderer2, EventEmitter, Output, AfterViewInit, OnDestroy } from '@angular/core';
import { DomController, Platform } from '@ionic/angular';
import * as Hammer from 'hammerjs';
import { takeWhile } from 'rxjs/internal/operators/takeWhile';

@Directive({
    selector: '[absolute-drag]'
})
export class AbsoluteDrag implements AfterViewInit, OnDestroy {

    @Input() startLeft: number;
    @Input() startTop: number;
    @Output() showExpand: EventEmitter<any> = new EventEmitter();
    // @Output("hideExpand") hideExpand: EventEmitter<any> = new EventEmitter();

    public callBox: HammerManager;
    public pltheight = this.plt.height();
    public pltwidth = this.plt.width();
    public largeFlag = false;
    public left: number;
    public top: number;
    public alive = true;
    public skeletonFlag = false;

    constructor(
        public element: ElementRef,
        public plt: Platform,
        public renderer: Renderer2,
        public domCtrl: DomController) {

        this.plt.resize
            .pipe(takeWhile(() => this.alive))
            .subscribe(
                () => {
                    this.pltheight = this.plt.height();
                    this.pltwidth = this.plt.width();

                    console.log('plt change detected!');
                    this.handleResize();
                }, (err) => {
                    console.log('err=>', err);
                });
    }

    public ngAfterViewInit(): void {
        console.log('check this =>', this.pltheight, this.pltwidth);

        this.renderer.setStyle(this.element.nativeElement, 'position', 'absolute');
        // this.renderer.setStyle(this.element.nativeElement, 'left', this.startLeft + 'px');
        // this.renderer.setStyle(this.element.nativeElement, 'top', this.startTop + 'px');

        this.renderer.setStyle(this.element.nativeElement, 'left', this.convertToInt(0.70 * this.pltwidth) + 'px');
        this.renderer.setStyle(this.element.nativeElement, 'top', this.convertToInt(0.90 * (0.70 * this.pltheight)) + 'px');

        this.createCallBox();
    }

    public ngOnDestroy(): void {
        this.alive = false;
    }

    public handlePan(ev: HammerInput): void {
        if (this.largeFlag) {
            return;
        }

        let newLeft = ev.center.x;
        let newTop = ev.center.y;

        // check boundaries conditions
        newLeft = (newLeft < 0) ? 0 : newLeft;
        newTop = (newTop < 0) ? 0 : newTop;

        // OLD
        // let maxWidth = !this.largeFlag ? this.convertToInt(this.pltwidth - (0.30 * this.pltwidth)) : this.convertToInt(this.pltwidth - (0.40 * this.pltwidth));
        // let maxHeight = !this.largeFlag ? this.convertToInt(0.90 * (this.pltheight - (0.30 * this.pltheight))) : this.convertToInt(0.90 * (this.pltheight - (0.40 * this.pltheight)));

        const maxWidth = this.convertToInt(0.70 * this.pltwidth);
        const maxHeight = this.convertToInt(0.90 * (0.70 * this.pltheight));

        if (newLeft >= maxWidth) {
            newLeft = maxWidth;
        }

        if (newTop >= maxHeight) {
            newTop = maxHeight;
        }

        this.domCtrl.write(() => {
            this.renderer.setStyle(this.element.nativeElement, 'left', newLeft + 'px');
            this.renderer.setStyle(this.element.nativeElement, 'top', newTop + 'px');
        });

        this.left = newLeft;
        this.top = newTop;

    }

    public handleResize() {
        if (this.largeFlag) {
            return;
        }
        const maxWidth = this.convertToInt(0.70 * this.pltwidth);
        const maxHeight = this.convertToInt(0.90 * (0.70 * this.pltheight));

        let newLeft;
        let newTop;
        // check values if exists
        if (isNaN(this.left) || !this.left) {
            newLeft = maxWidth;
        }

        if (isNaN(this.top) || !this.top) {
            newTop = maxHeight;
        }

        // check boundaries conditions
        newLeft = (this.left < 0) ? 0 : this.left;
        newTop = (this.top < 0) ? 0 : this.top;

        newLeft = (this.left > maxWidth) ? maxWidth : this.left;
        newTop = (this.top > maxHeight) ? maxHeight : this.top;


        this.domCtrl.write(() => {
            this.renderer.setStyle(this.element.nativeElement, 'left', newLeft + 'px');
            this.renderer.setStyle(this.element.nativeElement, 'top', newTop + 'px');
        });

        this.left = newLeft;
        this.top = newTop;
    }

    public handleDoubleTap(ev: HammerInput): void {
        if (!this.largeFlag) {
            this.renderer.setStyle(this.element.nativeElement, 'left', '0%');
            this.renderer.setStyle(this.element.nativeElement, 'top', '0%');
            this.renderer.setStyle(this.element.nativeElement, 'width', '100%');
            this.renderer.setStyle(this.element.nativeElement, 'height', '100%');
            this.stopCallBox();
            this.showExpand.emit();
        } else {
            this.renderer.setStyle(this.element.nativeElement, 'width', '30%');
            this.renderer.setStyle(this.element.nativeElement, 'height', '30%');
        }

        this.largeFlag = !this.largeFlag;
    }

    // public handleSingleTap(ev: HammerInput): void {
    //     if (!this.skeletonFlag) {
    //         this.renderer.setElementClass(this.element.nativeElement, 'skeleton', true);
    //         this.skeletonFlag = true;
    //     } else {
    //         this.handleDoubleTap(ev);
    //     }

    //     setTimeout(() => {
    //         this.skeletonFlag = false;
    //         this.renderer.setElementClass(this.element.nativeElement, 'skeleton', false);
    //     }, 5000);
    // }

    public createCallBox() {
        this.callBox = new Hammer.Manager(this.element.nativeElement, {
            recognizers: [
                [Hammer.Pan, { enable: true, direction: Hammer.DIRECTION_ALL }],
                [Hammer.Tap, { enable: true, direction: Hammer.DIRECTION_ALL, event: 'doubletap', taps: 2 }],

                // [Hammer.Tap, { enable: true, direction: Hammer.DIRECTION_ALL, event: 'singletap', taps: 1 }],
            ]
        });

        this.callBox.on('panup pandown panleft panright', (ev: HammerInput) => {
            this.handlePan(ev);
        });

        this.callBox.on('doubletap', (ev: HammerInput) => {
            this.handleDoubleTap(ev);
        });

        // this.callBox.on("singletap", (ev: HammerInput) => {
        //     this.handleSingleTap(ev);
        // });
    }

    public stopCallBox() {
        this.callBox.stop(true);
        this.callBox.destroy();
    }

    public convertToInt(value: number): number {
        return parseInt(String(value),10);
    }


    public minimize() {
        this.renderer.setStyle(this.element.nativeElement, 'left', this.left + 'px');
        this.renderer.setStyle(this.element.nativeElement, 'top', this.top + 'px');

        this.renderer.setStyle(this.element.nativeElement, 'width', '30%');
        this.renderer.setStyle(this.element.nativeElement, 'height', '30%');
        this.largeFlag = false;
    }
}
