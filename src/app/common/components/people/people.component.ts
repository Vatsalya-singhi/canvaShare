import { Component, OnInit } from '@angular/core';
import { PopoverController, NavParams } from '@ionic/angular';
import { Observable } from 'rxjs';
import { SocketService } from '../../socket.service';
import { DialogService } from '../../dialog.service';
import { LoggerService } from '../../logger.service';

@Component({
    selector: 'app-people',
    templateUrl: './people.component.html',
    styleUrls: ['./people.component.scss'],
})
export class PeopleComponent implements OnInit {

    constructor(
        public popoverCtrl: PopoverController,
        public navParams: NavParams,
        public socket: SocketService,
        public dialog: DialogService,
        public logger: LoggerService,
    ) {
        console.log('socket.configuration.role->',this.socket.configuration.role);
    }

    public ngOnInit() {

    }

    public async denyAccess(member: any) {
        await this.dialog.showToast(`Revoking edit access for ${member.username}`);

        this.socket.updateConfig(this.socket.configuration.room, member.id, false)
            .then(async (data: any) => {
                if (data && data.type === 'success') {
                    await this.dialog.showToast(`${member.username} access is now revoked..`);
                }

                if (data && data.type === 'fail') {
                    await this.dialog.showToast(`${member.username} access is still active ..`);
                }
            }).catch(async (err) => {
                await this.dialog.showToast(`Error occured ..`);
                console.log('err=>', err.message);

                await this.logger.log({
                    error: err.message,
                    type: 'deny-access',
                    createdAt: new Date(),
                });
            });
    }

    public async grantAccess(member: any) {
        await this.dialog.showToast(`Granting edit access for ${member.username}`);

        this.socket.updateConfig(this.socket.configuration.room, member.id, true)
            .then(async (data: any) => {

                if (data && data.type === 'success') {
                    await this.dialog.showToast(`${member.username} access is now granted..`);
                }

                if (data && data.type === 'fail') {
                    await this.dialog.showToast(`${member.username} access is still inactive ..`);
                }
            }).catch(async (err) => {
                await this.dialog.showToast(`Error occured ..`);
                console.log('err=>', err.message);

                await this.logger.log({
                    error: err.message,
                    type: 'grant-access',
                    createdAt: new Date(),
                });
            });
    }

    public async creatorClicked() {
        await this.dialog.showToast(`Cannot change access for creator`);
        return;
    }
}
