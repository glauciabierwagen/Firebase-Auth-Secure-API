// Firebase Admin SDK — used to verify tokens on the server side
// Unlike the client-side SDK, Admin has full privileges and never expires
import admin from "../firebaseAdmin.js";

// This is a middleware function — it runs BETWEEN receiving a request and reaching the route handler
// "middleware" means it sits in the middle of the request-response cycle
// The three parameters Express always gives middleware: req (request), res (response), next (go to next step)
export const verifyToken = async (req, res, next) => {
  // The client sends the token inside the "Authorization" request header
  // It looks like: "Bearer eyJhbGciOiJSUzI1NiIs..."
  const authHeader = req.headers.authorization;

  // We only want the token part, not the word "Bearer"
  // split(" ") turns "Bearer <token>" into ["Bearer", "<token>"]
  // [1] grabs the second item (the actual token)
  // The ?. (optional chaining) avoids a crash if authHeader is undefined
  const token = authHeader?.split(" ")[1];

  // If there's no token at all, stop here and send back a 401 (Unauthorized)
  // We use return so the rest of the function doesn't run
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    // admin.auth().verifyIdToken() talks to Firebase servers to check if the token is:
    // - valid (not tampered with)
    // - not expired
    // - issued by our Firebase project
    // If it's valid, we get back a decoded object with the user's uid, email, etc.
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Attach user info to request object
    // We add the decoded user info to req.user so the next route handler can access it
    // e.g. req.user.uid or req.user.email
    req.user = decodedToken;

    // next() tells Express "this middleware is done, move on to the actual route handler"
    // Without calling next(), the request would just hang and never get a response
    next();
  } catch (error) {
    // If verifyIdToken throws, the token was invalid or expired
    // We log the reason for debugging and return 401 to the client
    console.error("Error verifying token:", error.message);
    res.status(401).json({ message: "Unauthorized" });
  }
};
