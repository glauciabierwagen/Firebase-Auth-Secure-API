// Importing Firebase auth methods I need for this component
// GithubAuthProvider & GoogleAuthProvider are the social login providers
// getAuth gives us the auth instance, signInWithPopup opens a popup for login
// signOut logs the user out
import {
  GithubAuthProvider,
  GoogleAuthProvider,
  getAuth,
  signInWithPopup,
  signOut,
} from "firebase/auth";
// Our initialized Firebase app from the config file
import app from "../../firebase/firebase.init";
// useState to track the currently logged-in user
import { useState } from "react";

const Login = () => {
  // user state: null means no one is logged in, otherwise holds the Firebase user object
  const [user, setUser] = useState();

  // getAuth(app) connects to our specific Firebase project
  const auth = getAuth(app);
  // Creating provider instances — these tell Firebase which platform to use
  const googleProvider = new GoogleAuthProvider();
  const githubProvider = new GithubAuthProvider();

  // Handler for Google sign-in button
  const handleGoogleSignIn = async () => {
    try {
      // signInWithPopup opens a browser popup for the user to pick their Google account
      const result = await signInWithPopup(auth, googleProvider);
      const loggedInUser = result.user;
      console.log("User:", loggedInUser);

      // Retrieve the token
      // getIdToken(true) forces a refresh so we always get a fresh JWT token
      const token = await loggedInUser.getIdToken(true);
      console.log("Token:", token);

      // Save token to localStorage (or secure storage)
      // We store the token so we can send it with future API requests
      localStorage.setItem("token", token);

      // Set the user in your application state
      // This triggers a re-render and shows the logged-in UI
      setUser(loggedInUser);
    } catch (error) {
      // If the user closes the popup or something goes wrong, we log the error
      console.error("Error during sign-in:", error.message);
    }
  };

  // Handler for GitHub sign-in — same flow as Google, just different provider
  const handleGithubLogin = async () => {
    try {
      const result = await signInWithPopup(auth, githubProvider);
      const loggedInUser = result.user;
      console.log("User:", loggedInUser);

      // Get a fresh JWT token for the authenticated user
      const token = await loggedInUser.getIdToken(true);
      console.log("Token:", token);

      // Store token in localStorage for use in protected API calls
      localStorage.setItem("token", token);
      setUser(loggedInUser);
    } catch (error) {
      console.error("Error during GitHub sign-in:", error.message);
    }
  };

  // Handler for sign-out button
  const handleSignOut = async () => {
    try {
      // signOut(auth) clears the Firebase session
      await signOut(auth);
      console.log("User Signed out successfully!");
      // Clear user from state so the UI switches back to the login buttons
      setUser(null);
    } catch (error) {
      console.log("error", error.message);
    }
    // NOTE: This is a duplicate sign-out using the Promise (.then) style
    // It runs after the async/await block above — probably left here by accident
    signOut(auth)
      .then((result) => {
        console.log(result);
        setUser(null);
      })
      .catch((error) => {});
  };

  // This function calls our protected backend endpoint
  // The backend will reject the request if we don't send a valid token
  const fetchSecureData = async () => {
    try {
      // auth.currentUser gives us the currently signed-in user (or null)
      const currentUser = auth.currentUser;

      if (!currentUser) {
        console.log("No user is signed in.");
        return;
      }

      // Always get a fresh token before sending it to the backend
      // Firebase tokens expire after 1 hour, so passing true refreshes it
      const token = await currentUser.getIdToken(true);

      // Keep localStorage in sync with the latest token
      localStorage.setItem("token", token);

      // Send the token in the Authorization header as a Bearer token
      // The backend middleware will verify this token using Firebase Admin SDK
      const response = await fetch("http://localhost:5001/secure-data", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Secure data:", data);
      } else {
        // 401 means unauthorized (bad/expired token), 403 means forbidden
        console.log("Failed to fetch secure data:", response.status);
      }
    } catch (error) {
      console.log("Error fetching secure data:", error.message);
    }
  };

  return (
    <div>
      {/* Conditional rendering: show different buttons based on login state */}
      {user ? (
        <>
          {/* User is logged in — show Sign Out and the secure data button */}
          <button onClick={handleSignOut}>Sign Out</button>
          <button onClick={fetchSecureData}>Fetch Secure Data</button>
        </>
      ) : (
        <div>
          {/* User is NOT logged in — show the social login buttons */}
          <button onClick={handleGoogleSignIn}>Google Login</button>
          <button onClick={handleGithubLogin}>GitHub Login</button>
        </div>
      )}
      {/* Only show user info if someone is logged in */}
      {user && (
        <div>
          <h3>User: {user.displayName}</h3>
          <p>Email: {user.email}</p>
        </div>
      )}
    </div>
  );
};

export default Login;
