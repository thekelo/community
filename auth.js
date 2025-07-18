// Inside the signup section of handleAuthSubmit
const userCredential = await auth.createUserWithEmailAndPassword(email, password);

// Send verification email
await userCredential.user.sendEmailVerification();

// Update user profile
await userCredential.user.updateProfile({
    displayName: name
});

// Create user document in Firestore
await db.collection('users').doc(userCredential.user.uid).set({
    uid: userCredential.user.uid,
    email: userCredential.user.email,
    displayName: name,
    photoURL: '',
    emailVerified: false,
    joinedAt: firebase.firestore.FieldValue.serverTimestamp()
});

showSuccess('Registration successful! Please check your email for verification.');
