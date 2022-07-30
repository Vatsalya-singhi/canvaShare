import { Doc } from './common.model';
import * as moment from 'moment';

export class User extends Doc {

    email: string;
    photoURL: string;

    constructor(obj: any) {
        super(obj);
        if (!obj) {
            obj = {};
        }

        this.email = obj.email ? obj.email : '';
        this.photoURL = obj.photoURL ? obj.photoURL : '';
    }
}
