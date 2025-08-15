import firebase from 'firebase/compat/app'
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';

const firebaseConfig = {
  apiKey: "process.env.firebaseapikey",
  authDomain: "olx-clone-e1529.firebaseapp.com",
  projectId: "olx-clone-e1529",
  storageBucket: "olx-clone-e1529.appspot.com",
  messagingSenderId: "656164717735",
  appId: "1:656164717735:web:fb439e9e14e1b8df3dc782",
  measurementId: "G-6EBKE2LMRZ"
  };

export default firebase.initializeApp(firebaseConfig)

export const createUserProfile = async (user, additionalData) => {
  if (!user) {
    console.error("No user provided to createUserProfile");
    return;
  }

  const userRef = firebase.firestore().collection('users').doc(user.uid);

  try {
    const snapshot = await userRef.get();

    if (!snapshot.exists) {
      const { displayName, email } = user;
      const createdAt = new Date();

      await userRef.set({
        displayName,
        email,
        createdAt,
        profilePicture: null,
        bio: '',
        location: '',
        phoneNumber: '',
        ...additionalData
      });

      console.log("User profile created successfully.");
    } else {
      console.log("User profile already exists.");
    }
  } catch (error) {
    console.error("Error inside createUserProfile:", error);
  }

  return userRef;
};
