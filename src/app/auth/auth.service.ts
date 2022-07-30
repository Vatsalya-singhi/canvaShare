/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable no-var */
/* eslint-disable no-debugger */
import { Injectable } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { Observable, of } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';

import { Platform } from '@ionic/angular';
// import { GooglePlus } from '@ionic-native/google-plus/ngx';
import { GooglePlus } from '@awesome-cordova-plugins/google-plus/ngx';

import {
    Auth,
    authState,
    // signInWithCredential,
    // signInWithRedirect,
    signInWithPopup,
    signInWithEmailAndPassword,
    AuthCredential,
    GoogleAuthProvider,
    // getRedirectResult,
    UserCredential,
    // OAuthCredential,
    // sendEmailVerification,
    createUserWithEmailAndPassword,
    updatePassword,
    signOut,
} from '@angular/fire/auth';
import {
    Firestore,
    collectionData,
    collection,
    doc,
    docData,
    DocumentData,
    DocumentReference,
    namedQuery,
    addDoc,
    setDoc,
    updateDoc,
} from '@angular/fire/firestore';
import { Analytics, logEvent } from '@angular/fire/analytics';
import { Storage } from '@angular/fire/storage';

import { FirestoreService } from '../common/firestore.service';

import { User } from '../common/model/user.model';

import { Capacitor } from '@capacitor/core';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    public user$: Observable<User>;
    public user: User = null;

    constructor(
        public afAuth: Auth,
        public db: Firestore,
        public storage: Storage,
        public analytics: Analytics,

        public router: Router,
        public route: ActivatedRoute,
        public firestore: FirestoreService,
        public plt: Platform,
        public googlePlus: GooglePlus
    ) {
        this.user$ = authState(this.afAuth).pipe(
            switchMap((user) => {
                if (user) {
                    console.log('user=>', user);
                    const obj: DocumentReference<DocumentData> = doc(
                        this.db,
                        `User/${user.uid}`
                    );
                    return docData(obj);
                } else {
                    return of(null);
                }
            }),
            tap(async (userObject: User) => {
                console.log('userObject=>', userObject);
                this.user = userObject;
                logEvent(this.analytics, 'login');
            })
        );
    }

    /**************************************************************
     ****************Public Functions*****************************
     *************************************************************/

    public async googleSignin(): Promise<any> {
        if (Capacitor.isNativePlatform()) {
            console.log('native login called');

            // var credential: AuthCredential = new AuthCredential();
            // var signInRes: UserCredential = await signInWithCredential(
            //     this.afAuth,
            //     credential
            // );
            const options = {};
            // const options = {
            //     scopes: 'profile email',
            //     webClientId: '914595712966-1lb3sh63ff87719snb3psrnrpcc444u3.apps.googleusercontent.com',
            //     offline: true,
            // };
            const signInRes = await this.googlePlus.login(options);
            console.log("signInRes=>", signInRes);
            if (signInRes) {
                // This gives you a Google Access Token. NOT USED IN MAKING API CALLS FOR NOW
                const oAuthCredential =
                    GoogleAuthProvider.credentialFromResult(signInRes);
                const token = oAuthCredential.accessToken;
                // This is the signed-in user
                this.updateUserData(signInRes.user);
                return signInRes.user;
            } else {
                logEvent(this.analytics, 'google-login-error');
                return null;
            }
        } else {
            console.log('web login called');

            const googleProvider = new GoogleAuthProvider();
            googleProvider.addScope('profile');
            googleProvider.addScope('email');
            googleProvider.setCustomParameters({
                prompt: 'select_account',
            });

            // if (this.plt.is('mobileweb') || this.plt.is('mobile')) {
            //     console.log('2 is called');
            //     localStorage.setItem('google2method', 'true');
            //     // This will trigger a full page redirect away from your app
            //     await signInWithRedirect(this.afAuth, googleProvider);
            //     // After returning from the redirect when your app initializes you can obtain the result
            //     result = await getRedirectResult(this.afAuth);
            // } else {
            //     console.log('3 is called');
            //     result = await signInWithPopup(this.afAuth, googleProvider);
            // }

            const result: UserCredential = await signInWithPopup(this.afAuth, googleProvider);

            if (result) {
                // This gives you a Google Access Token. NOT USED IN MAKING API CALLS FOR NOW
                // const credential = GoogleAuthProvider.credentialFromResult(result);
                // const token = credential.accessToken;
                // This is the signed-in user
                this.updateUserData(result.user);
                return result.user;
            } else {
                logEvent(this.analytics, 'google-login-error');
                return null;
            }

        }


    }

    public async signInWithEmail(credentials: any) {
        console.log('Sign in with email');

        const result = await signInWithEmailAndPassword(
            this.afAuth,
            credentials.email,
            credentials.password
        );

        if (result) {
            const user = result.user;
            this.updateUserData(user);
            return user;
        } else {
            logEvent(this.analytics, 'email-login-error');
            return null;
        }
    }

    public async registerWithEmail(credentials: any) {
        console.log('Register with email');

        const result = await createUserWithEmailAndPassword(
            this.afAuth,
            credentials.email,
            credentials.password
        );

        if (result) {
            const user = result.user;
            this.updateUserData(user);
            return user;
        } else {
            logEvent(this.analytics, 'email-register-error');
            return null;
        }
    }

    public async updatePassword(credentials: any) {
        console.log('update password');
        return await updatePassword(this.afAuth.currentUser, credentials.password);
    }

    public async signOut(): Promise<any> {
        localStorage.clear();
        await signOut(this.afAuth);
        if (
            this.plt.is('cordova') &&
            (this.plt.is('ios') || this.plt.is('android'))
        ) {
            try {
                await this.googlePlus.logout();
            } catch (err) { }
        }
        this.router.navigate(['/login']);
    }

    public checkAuthorisation(
        collectionName: string,
        email: string
    ): Observable<any> {
        return this.firestore.queryDocWithMatchingField(
            'User',
            `${collectionName}`,
            'email',
            '==',
            email
        );
    }

    private async updateUserData(credentials: any) {
        if (credentials == null || !credentials) {
            console.log('credentials is null thus returning');
            return;
        }

        const data = new User({
            id: credentials.uid,
            email: credentials.email,
            name: credentials.displayName,
            createdBy: credentials.uid,
            updatedBy: credentials.uid,
            photoURL: credentials.photoURL,
        });

        console.log('data=>', data);
        this.user = new User(data);

        const userRef = doc(this.db, `User/${credentials.uid}`);
        await setDoc(userRef, { ...data }, { merge: true });

        // const userRef: AngularFirestoreDocument<any> = this.db.doc(
        //   `User/${credentials.uid}`
        // );
        // userRef.set(
        //   {
        //     ...data,
        //   },
        //   { merge: true }
        // );
    }


}
