import * as moment from 'moment';

export class Doc {
    id: string;
    name: string;
    createdAt: Date;
    createdBy: string;
    updatedAt: Date;
    updatedBy: string;
    isActive: boolean;

    constructor(obj: any) {

        if (!obj) {
            obj = {};
        }

        this.id = obj.id ? obj.id : '';
        this.name = obj.name ? obj.name : '';

        if (obj.createdAt) {
            if (moment.isMoment(obj.createdAt)) {
                this.createdAt = obj.createdAt.toDate();
            } else if (obj.createdAt.seconds) {
                this.createdAt = new Date(obj.createdAt.seconds * 1000);
            } else {
                this.createdAt = obj.createdAt;
            }
        } else {
            this.createdAt = new Date();
        }

        this.createdBy = obj.createdBy ? obj.createdBy : '';

        if (obj.updatedAt) {
            if (moment.isMoment(obj.updatedAt)) {
                this.updatedAt = obj.updatedAt.toDate();
            } else if (obj.updatedAt.seconds) {
                this.updatedAt = new Date(obj.updatedAt.seconds * 1000);
            } else {
                this.updatedAt = obj.updatedAt;
            }
        } else {
            this.updatedAt = new Date();
        }

        this.updatedBy = obj.updatedBy ? obj.updatedBy : '';
        this.isActive = obj.isActive ? obj.isActive : true;
    }
}
