/* eslint-disable @typescript-eslint/naming-convention */
import { Injectable } from '@angular/core';
import * as moment from 'moment';
import { v4 as uuidv4 } from 'uuid';
import { DialogService } from '../common/dialog.service';

@Injectable({
    providedIn: 'root'
})
export class PageService {

    constructor(
        public dialog: DialogService
    ) { }

    public getUniqueGroupName(): any {
        return uuidv4();
    }

    public async LastRoomCheck(): Promise<any> {
        const obj = JSON.parse(localStorage.getItem('room'));
        console.log('obj=>', obj);

        if (obj && obj.room && obj.room.length > 0) {
            const output = await this.dialog.askConfirmation(`Do you want to rejoin ${obj.room} ??`);
            console.log('output=>', output);
            if (output.role === 'Yes') {
                // update join form and join
                return obj;
            } else {
                localStorage.removeItem('room');
                return null;
            }
        }
        return null;
    }

    public saveRoomLocally(config: any): void {
        localStorage.setItem('room', JSON.stringify({
            room: config.room,
            password: config.password
        }));
    }

}
