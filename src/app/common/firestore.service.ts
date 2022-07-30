/* eslint-disable no-debugger */
/* eslint-disable max-len */
import { Injectable } from '@angular/core';

import {
    Firestore,
    collection,
    doc,
    setDoc,
    CollectionReference,
    DocumentData,
    query,
    collectionData,
    Query,
    where,
    getDocs,
    getDoc,
    docData,
    deleteDoc,
    orderBy,
    limit,
    limitToLast,
 } from '@angular/fire/firestore';

import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})

export class FirestoreService {

    public classes: any = {};

    constructor(
        private db: Firestore,
    ) {

    }

    /**************************************************************
     ****************Collection Functions***************************
     *************************************************************/

    public newId(): string {
        return doc(collection(this.db, 'id')).id;
        // return this.db.createId();
    }

    public queryDocWithMatchingField(className: string, collectionName: string, fieldName: string, condition: any, value: any): Observable<any> {
        // console.log('check this ! =>', className, collectionName, fieldName, condition, value);
        const collectionRef: CollectionReference<DocumentData> = collection(this.db,collectionName);
        const q = query(collectionRef, where(fieldName, condition, value));
        return collectionData(q)
            .pipe(
                map((data: DocumentData[]) => {
                    debugger;
                    console.log('data=>', data);
                    return data.map((d: DocumentData) => new this.classes[className](d));
                })
                , shareReplay(1));
        // return this.db.collection(collectionName, ref => ref.where(fieldName, condition, value)).valueChanges()
        //     .pipe(
        //         map((data: any) => {
        //             console.log('data=>', data);
        //             return data.map(d => new this.classes[className](d));
        //         })
        //         , shareReplay(1));
    }

    public getAllDocuments(className: string, collectionName: string): Observable<any> {
        const collectionRef: CollectionReference<DocumentData> = collection(this.db,collectionName);
        const q = query(collectionRef);
        return collectionData(q)
            .pipe(
                map((data: DocumentData[]) => {
                    debugger;
                    console.log('data=>', data);
                    return data.map((d: DocumentData) => new this.classes[className](d));
                })
                , shareReplay(1));
        // return this.db.collection(collectionName).valueChanges()
        //     .pipe(
        //         map((data: any) => {
        //             console.log('data=>', data);
        //             return data.map(d => new this.classes[className](d));
        //         })
        //         , shareReplay(1));
    }

    public fetchDocumentInCollection(collectionName: string, id: string): Observable<any> {
        const userRef =  doc(this.db, `${collectionName}/${id}`);
        return docData(userRef);
        // return this.db.collection(collectionName).doc(id).valueChanges();
    }


    // !!!! NEW UPDATED FUNCTIONS !!!!
    public fetchAllDocFromCollection(className: string, collectionName: string): Observable<any[]> {
        const collectionRef = collection(this.db,collectionName);
        const q = query(collectionRef);
        return collectionData(q)
            .pipe(
                map((data: DocumentData[]) => {
                    debugger;
                    console.log('data=>', data);
                    return data.map((d: DocumentData) => new this.classes[className](d));
                })
                , shareReplay(1));
        // return this.db.collection(collectionName).valueChanges()
        //     .pipe(
        //         map((data: any) => data.map((d: any) => {
        //                 if (className.length > 0) {
        //                     return new this.classes[className](d);
        //                 } else {
        //                     return d;
        //                 }
        //             }))
        //         , shareReplay(1)
        //     );
    }

    public fetchDocByIdFromCollection(collectionName: string, documentId: string): Observable<any> {
        const docRef = doc(this.db,collectionName,documentId);
        return docData(docRef);
        // return this.db.collection(collectionName).doc(documentId)
        //     .valueChanges();
    }

    public queryDocWith2MatchingFields(className: string, collectionName: string, fieldName1: string, condition1: any, value1: any, fieldName2: string, condition2: any, value2: any): Observable<any[]> {
        const collectionRef = collection(this.db,collectionName);
        const q = query(collectionRef, where(fieldName1, condition1, value1), where(fieldName2, condition2, value2) );
        return collectionData(q)
            .pipe(
                map((data: DocumentData[]) => {
                    debugger;
                    console.log('data=>', data);
                    return data.map((d: DocumentData) => new this.classes[className](d));
                })
                , shareReplay(1));
        // return this.db.collection(collectionName, ref => ref.where(fieldName1, condition1, value1).where(fieldName2, condition2, value2)).valueChanges()
        //     .pipe(
        //         map((data: any) => data.map(d => new this.classes[className](d)))
        //         , shareReplay(1)
        //     );
    }

    public queryDocWith3MatchingFields(collectionName: string, fieldName1: string, condition1: any, value1: string, fieldName2: string, condition2: any, value2: string, fieldName3: string, condition3: any, value3: string): Observable<any[]> {
        const collectionRef = collection(this.db,collectionName);
        const q = query(collectionRef, where(fieldName1, condition1, value1), where(fieldName2, condition2, value2), where(fieldName3, condition3, value3) );
        return collectionData(q)
            .pipe(shareReplay(1));
        // return this.db.collection(collectionName, ref => ref.where(fieldName1, condition1, value1).where(fieldName2, condition2, value2).where(fieldName3, condition3, value3))
        //     .valueChanges();
    }

    public updateDocument(collectionName: string, documentId: string, payload: any): Promise<void> {
        const docRef = doc(this.db,collectionName,documentId);
        return setDoc(docRef,{...payload},{merge : true});
        // return this.db.collection(collectionName)
        //     .doc(documentId)
        //     .set({ ...payload }, { merge: true });
    }

    public deleteDocument(collectionName: string, id: string): Promise<void> {
        const docRef = doc(this.db,collectionName,id);
        return deleteDoc(docRef);
        // return this.db.collection(collectionName).doc(id).delete();
    }

    /**************************************************************
     ****************Subcollection Functions*********************************
     *************************************************************/

    public fetchSubCollection(className: string, collectionName: string, documentId: string, subCollectionName: string): Observable<any> {
        const collectionRef = collection(this.db,collectionName,documentId,subCollectionName);
        const q = query(collectionRef);
        return collectionData(q)
            .pipe(
                map((data: DocumentData[]) => {
                    debugger;
                    console.log('data=>', data);
                    return data.map((d: DocumentData) => new this.classes[className](d));
                })
                , shareReplay(1));
        // return this.db.collection(collectionName).doc(documentId).collection(subCollectionName).valueChanges()
        //     .pipe(
        //         map((data: any) => data.map(d => new this.classes[className](d)))
        //         , shareReplay(1)
        //     );
    }

    public fetchSubCollectionByLimit(className: string, collectionName: string, documentId: string, subCollectionName: string, limiter: number): Observable<any> {
        const collectionRef = collection(this.db, collectionName,documentId,subCollectionName);
        const q = query(collectionRef,orderBy('createdAt', 'desc'), limitToLast(limiter));
        return collectionData(q)
            .pipe(
                map((data: DocumentData[]) => {
                    debugger;
                    console.log('data=>', data);
                    return data.map((d: DocumentData) => new this.classes[className](d));
                })
                , shareReplay(1));
        // return this.db.collection(collectionName).doc(documentId).collection(subCollectionName, ref => ref.orderBy('createdAt', 'desc')
        //         .limit(limit)).valueChanges()
        //     .pipe(
        //         map((data: any) => data.map(d => new this.classes[className](d)))
        //         , shareReplay(1)
        //     );
    }

    public fetchDocumentInSubCollection(className: string, collectionName: string, documentId: string, subCollectionName: string, documentId2: string): Observable<any> {
        const docRef = doc(this.db,collectionName,documentId,subCollectionName,documentId2);
        return docData(docRef).pipe(
            map((data: any) => new this.classes[className](data))
            , shareReplay(1)
        );
        // return this.db.collection(collectionName).doc(documentId).collection(subCollectionName).doc(documentId2).valueChanges()
        //     .pipe(
        //         map((data: any) => new this.classes[className](data))
        //         , shareReplay(1)
        //     );
    }

    public querysubcollectionMatchingField(collectionName: string, documentId: string, subCollectionName: string, fieldName1: string, condition1: any, value1: string): Observable<any> {
        const collectionRef = collection(this.db,collectionName,documentId,subCollectionName);
        const q = query(collectionRef,where(fieldName1, condition1, value1));
        return collectionData(q);
        // return this.db.collection(collectionName).doc(documentId).collection(subCollectionName, ref => ref.where(fieldName1, condition1, value1)).valueChanges();
    }

    public querysubcollection2MatchingField(collectionName: string, documentId: string, subCollectionName: string, fieldName1: string, condition1: any, value1: string, fieldName2: string, condition2: any, value2: string): Observable<any> {
        const collectionRef = collection(this.db,collectionName,documentId,subCollectionName);
        const q = query(collectionRef,where(fieldName1, condition1, value1),where(fieldName2, condition2, value2));
        return collectionData(q);
        // return this.db.collection(collectionName).doc(documentId).collection(subCollectionName, ref => ref.where(fieldName1, condition1, value1).where(fieldName2, condition2, value2)).valueChanges();
    }

    public querysubcollection3MatchingField(collectionName: string, documentId: string, subCollectionName: string, fieldName1: string, condition1: any, value1: string, fieldName2: string, condition2: any, value2: string, fieldName3: string, condition3: any, value3: string): Observable<any> {
        const collectionRef = collection(this.db,collectionName,documentId,subCollectionName);
        const q = query(collectionRef,where(fieldName1, condition1, value1),where(fieldName2, condition2, value2),where(fieldName3, condition3, value3));
        return collectionData(q);
        // return this.db.collection(collectionName).doc(documentId).collection(subCollectionName, ref => ref.where(fieldName1, condition1, value1).where(fieldName2, condition2, value2).where(fieldName3, condition3, value3)).valueChanges();
    }

    public updateSubCollection(collectionName: string, documentId: string, subCollectionName: string, documentId2: string, payload: any): Promise<void> {
        const docRef = doc(this.db,collectionName,documentId,subCollectionName,documentId2);
        return setDoc(docRef,{...payload},{merge:true});
        // return this.db.collection(collectionName)
        //     .doc(documentId)
        //     .collection(subCollectionName)
        //     .doc(documentId2)
        //     .set({ ...payload }, { merge: true });
    }

    public deleteDocumentInSubCollection(collectionName: string, subCollectionName: string, documentId: string, documentId2: string): Promise<void> {
        const docRef = doc(this.db,collectionName,documentId,subCollectionName,documentId2);
        return deleteDoc(docRef);
        // return this.db.collection(collectionName)
        //     .doc(documentId)
        //     .collection(subCollectionName)
        //     .doc(documentId2)
        //     .delete();
    }

    /**************************************************************
     ****************GrandSubCollection Functions*********************************
     *************************************************************/

    public fetchGrandSubCollection(className: string, collectionName: string, subCollectionName: string, grandSubCollectionName: string, documentId: string, documentId2: string): Observable<any> {
        const collectionRef = collection(this.db,collectionName,documentId,subCollectionName,documentId2,grandSubCollectionName);
        return collectionData(collectionRef)
        .pipe(
            map((data: DocumentData[]) => data.map(d => new this.classes[className](d)))
            , shareReplay(1)
        );
        // return this.db.collection(collectionName).doc(documentId).collection(subCollectionName).doc(documentId2).collection(grandSubCollectionName).valueChanges()
        //     .pipe(
        //         map((data: any) => data.map(d => new this.classes[className](d)))
        //         , shareReplay(1)
        //     );
    }

    public fetchDocumentInGrandSubCollection(className: string, collectionName: string, subCollectionName: string, grandSubCollectionName: string, documentId: string, documentId2: string, documentId3: string): Observable<any> {
        const docRef = doc(this.db,collectionName,documentId,subCollectionName,documentId2,grandSubCollectionName,documentId3);
        return docData(docRef)
        .pipe(
            map((data: any) => {
                if (!data) {
                    return null;
                }
                return new this.classes[className](data);
            })
            , shareReplay(1)
        );
        // return this.db.collection(collectionName).doc(documentId).collection(subCollectionName).doc(documentId2).collection(grandSubCollectionName).doc(documentId3).valueChanges()
        //     .pipe(
        //         map((data: any) => {
        //             if (!data) {
        //                 return null;
        //             }
        //             return new this.classes[className](data);
        //         })
        //         , shareReplay(1)
        //     );
    }

    public queryGrandSubcollectionMatchingField(collectionName: string, subCollectionName: string, grandSubCollectionName: string, documentId: string, documentId2: string, fieldName1: string, condition1: any, value1: string): Observable<any> {
        const collectionRef = collection(this.db,collectionName,documentId,subCollectionName,documentId2,grandSubCollectionName);
        const q = query(collectionRef,where(fieldName1, condition1, value1));
        return collectionData(q);
        // return this.db.collection(collectionName).doc(documentId).collection(subCollectionName).doc(documentId2).collection(grandSubCollectionName, ref => ref.where(fieldName1, condition1, value1)).valueChanges();
    }

    public queryGrandSubcollection2MatchingField(collectionName: string, subCollectionName: string, grandSubCollectionName: string, documentId: string, documentId2: string, fieldName1: string, condition1: any, value1: string, fieldName2: string, condition2: any, value2: string): Observable<any> {
        const collectionRef = collection(this.db,collectionName,documentId,subCollectionName,documentId2,grandSubCollectionName);
        const q = query(collectionRef,where(fieldName1, condition1, value1), where(fieldName2, condition2, value2));
        return collectionData(q);
        // return this.db.collection(collectionName).doc(documentId).collection(subCollectionName).doc(documentId2).collection(grandSubCollectionName, ref => ref.where(fieldName1, condition1, value1).where(fieldName2, condition2, value2)).valueChanges();
    }

    public queryGrandSubcollection3MatchingField(collectionName: string, subCollectionName: string, grandSubCollectionName: string, documentId: string, documentId2: string, fieldName1: string, condition1: any, value1: string, fieldName2: string, condition2: any, value2: string, fieldName3: string, condition3: any, value3: string): Observable<any> {
        const docRef = collection(this.db,collectionName,documentId,subCollectionName,documentId2,grandSubCollectionName);
        const q = query(docRef,where(fieldName1, condition1, value1), where(fieldName2, condition2, value2), where(fieldName3, condition3, value3));
        return collectionData(q);
        // return this.db.collection(collectionName).doc(documentId).collection(subCollectionName).doc(documentId2).collection(grandSubCollectionName, ref => ref.where(fieldName1, condition1, value1).where(fieldName2, condition2, value2).where(fieldName3, condition3, value3)).valueChanges();
    }

    public updateGrandSubCollection(collectionName: string, subCollectionName: string, grandSubCollectionName: string, documentId: string, documentId2: string, documentId3: string, payload: any): Promise<void> {
        const docRef = doc(this.db,collectionName,documentId,subCollectionName,documentId2,grandSubCollectionName,documentId3);
        return setDoc(docRef,{...payload},{merge:true});
        // return this.db.collection(collectionName)
        //     .doc(documentId)
        //     .collection(subCollectionName)
        //     .doc(documentId2)
        //     .collection(grandSubCollectionName)
        //     .doc(documentId3)
        //     .set(payload, { merge: true });
    }

    public deleteGrandSubCollection(collectionName: string, subCollectionName: string, grandSubCollectionName: string, documentId: string, documentId2: string, documentId3: string): Promise<void> {
        const docRef = doc(this.db,collectionName,documentId,subCollectionName,documentId2,grandSubCollectionName,documentId3);
        return deleteDoc(docRef);
        // return this.db.collection(collectionName)
        //     .doc(documentId)
        //     .collection(subCollectionName)
        //     .doc(documentId2)
        //     .collection(grandSubCollectionName)
        //     .doc(documentId3)
        //     .delete();
    }

    public getNewId(): string {
        return doc(collection(this.db, 'id')).id;
        // return this.db.createId();
    }

}
