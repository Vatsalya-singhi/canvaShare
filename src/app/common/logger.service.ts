import { Injectable } from '@angular/core';
import { FirestoreService } from './firestore.service';

@Injectable({
    providedIn: 'root'
})
export class LoggerService {

    constructor(public db: FirestoreService) {

    }

    public log(object: any): Promise<void> {
        const payload = {
            ...object,
            id: this.db.newId(),
        };

        return this.db.updateDocument('logs', payload.id, payload);
    }
}
