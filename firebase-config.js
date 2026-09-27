import { initializeApp } from
"https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";

import { getFirestore } from
"https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

import { getAuth } from
"https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";


const firebaseConfig = {

    apiKey: "AIzaSyCbliJPl_NS8cV5Jv4gje8IKcKtFWRmq7U",

    authDomain:
        "turfnova-c3c0d.firebaseapp.com",

    projectId:
        "turfnova-c3c0d",

    storageBucket:
        "turfnova-c3c0d.firebasestorage.app",

    messagingSenderId:
        "784359956378",

    appId:
        "1:784359956378:web:9304995d2c12e040012423"

};


export const app =
    initializeApp(firebaseConfig);

export const db =
    getFirestore(app);

export const auth =
    getAuth(app);