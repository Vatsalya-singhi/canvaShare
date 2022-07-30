import { Component, OnInit } from '@angular/core';
import { NavParams, PopoverController } from '@ionic/angular';

@Component({
    selector: 'app-options',
    templateUrl: './options.component.html',
    styleUrls: ['./options.component.scss'],
})
export class OptionsComponent implements OnInit {

    public selectedColor = '#9e2956';
    public colors: any[] = ['#9e2956', '#c2281d', '#de722f', '#edbf4c', '#5db37e', '#FFFFFF', '#459cde', '#4250ad', '#802fa3'];

    public lineWidth = 5;

    constructor(
        public popoverCtrl: PopoverController,
        public navParams: NavParams
    ) { }

    public ngOnInit() {
        const params = this.navParams.data;
        this.lineWidth = params.lineWidth;
        this.selectedColor = params.selectedColor;
    }

    public selectColor(color: string): void {
        this.selectedColor = color;
    }

    public save() {
        this.popoverCtrl.dismiss({
            selectedColor: this.selectedColor,
            lineWidth: this.lineWidth,
        }, 'submit');
    }

    public cancel() {
        this.popoverCtrl.dismiss({

        }, 'cancel');
    }

}
