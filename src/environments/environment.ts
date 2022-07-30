// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  firebase: {
    projectId: 'canva-share',
    appId: '1:914595712966:web:6f3617de51337b6d342cc7',
    databaseURL: 'https://canva-share.firebaseio.com',
    storageBucket: 'canva-share.appspot.com',
    locationId: 'us-central',
    apiKey: 'AIzaSyDnLdqKBsavxyXBGJ_6N8wpS1XKlgagd_o',
    authDomain: 'canva-share.firebaseapp.com',
    messagingSenderId: '914595712966',
    measurementId: 'G-95JEGSWHCE',
  },
  production: false,
  firebaseConfig: {
    apiKey: 'AIzaSyDnLdqKBsavxyXBGJ_6N8wpS1XKlgagd_o',
    authDomain: 'canva-share.firebaseapp.com',
    databaseURL: 'https://canva-share.firebaseio.com',
    projectId: 'canva-share',
    storageBucket: 'canva-share.appspot.com',
    messagingSenderId: '914595712966',
    appId: '1:914595712966:web:6f3617de51337b6d342cc7',
    measurementId: 'G-95JEGSWHCE',
    url: 'https://canvassocketypescript.herokuapp.com/',
  },
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
