// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-analytics.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js"
import { collection, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js"; 
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries



// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyC5lDAG_chA4mkKQjtagfunUzKXTiu9Qwk",
    authDomain: "jiawan-barcode.firebaseapp.com",
    projectId: "jiawan-barcode",
    storageBucket: "jiawan-barcode.firebasestorage.app",
    messagingSenderId: "377251855826",
    appId: "1:377251855826:web:3569849dce6eb4aaae9c0b",
    measurementId: "G-XNL8WJV4ET"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

var checkout_date = new Date()
checkout_date.setHours(checkout_date.getHours() + 8)
document.getElementById("checkout_date").valueAsDate = checkout_date;
checkout_date = $("#checkout_date").val();

const docRef = doc(db, "sales", checkout_date);

const docSnap = await getDoc(docRef);
if (docSnap.exists()) {
    console.log("Document data:", docSnap.data());
} else {
    // docSnap.data() will be undefined in this case
    console.log("No such document!");
}