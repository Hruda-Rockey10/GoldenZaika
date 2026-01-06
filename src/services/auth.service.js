import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth, db } from "../lib/firebase/client";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { logger } from "../lib/logger/logger";

class AuthService {
  /**
   * Register a new user    It does not affect how the code runs. It acts as documentation
   * @param {string} email
   * @param {string} password
   * @param {string} name
   * It tells VS Code that the function expects
   * an argument called email and it should be a text string.
   */
  async register(email, password, name) {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      //   {
      //   user: {
      //     uid: "a1b2c3d4e5f6...",       // The unique ID for this user
      //     email: "test@example.com",    // The email they utilized
      //     emailVerified: false,         // Have they clicked the verify link?
      //     displayName: null,            // Currently empty (until you update it)
      //     isAnonymous: false,           // Is this a guest user?
      //     providerData: [...],          // Info if they used Google/Facebook
      //     ... (many internal methods like getIdToken)
      //   },
      //   providerId: null,               // "password" (since you used email/pass)
      //   operationType: "signIn"         // What just happened
      // }

      await updateProfile(user, { displayName: name });

      // Create user document in Firestore
      await this.createUserDocument(user, { name, role: "user" });

      //  THIS refers to the AuthService class itself.
      //  You are calling a "sibling" function that lives in the same house. (line 135-153)

      return user;
    } catch (error) {
      logger.error("AuthService.register error", error);
      throw error;
    }
  }

  /**
   * Login with email and password
   * @param {string} email
   * @param {string} password
   */
  async login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      return userCredential.user;
    } catch (error) {
      logger.error("AuthService.login error", error);
      throw error;
    }
  }

  /**
   * Login with Google
   */
  async loginWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user document exists, if not create it
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        await this.createUserDocument(user, {
          name: user.displayName,
          role: "user",
          photoURL: user.photoURL,
        });
      }

      return user;
    } catch (error) {
      logger.error("AuthService.loginWithGoogle error", error);
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout() {
    try {
      await signOut(auth);
    } catch (error) {
      logger.error("AuthService.logout error", error);
      throw error;
    }
  }

  /**
   * Send password reset email
   * @param {string} email
   */
  async sendPasswordResetEmail(email) {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      logger.error("AuthService.sendPasswordResetEmail error", error);
      throw error;
    }
  }

  /**
   * Create user document in Firestore
   * @param {object} user Firebase user object
   * @param {object} additionalData
   */
  async createUserDocument(user, additionalData = {}) {
    if (!user) return;

    const userRef = doc(db, "users", user.uid);
    // doc = Create a Reference (a pointer/address) to a specific document.
    // UseRed = to store the address of the document.
    try {
      await setDoc(
        userRef,
        {
          uid: user.uid,
          email: user.email,
          createdAt: serverTimestamp(),
          ...additionalData,
        },
        { merge: true }
        // : It intelligently updates the document.
        // It adds new fields or updates existing ones,
        // but leaves other existing fields alone. It's safer.
      );
    } catch (error) {
      logger.error("Error creating user document", error);
    }
  }

  /**
   * Get Current User Role
   * @param {string} uid
   */
  async getUserRole(uid) {
    if (!uid) return null;
    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        return userDoc.data().role || "user";
      }
      return "user";
    } catch (error) {
      logger.error("Error fetching user role", error);
      return "user";
    }
  }

  /**
   * Send contact message (uses API route to save to database)
   * @param {object} data - Contact form data (name, email, message)
   */
  async sendMessage(data) {
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to send message");
      }

      return await response.json();
    } catch (error) {
      logger.error("AuthService.sendMessage error", error);
      throw error;
    }
  }

  /**
   * Get all contact messages (admin only)
   */
  async getMessages() {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch("/api/messages", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch messages");
      }
      return await response.json();
    } catch (error) {
      logger.error("AuthService.getMessages error", error);
      throw error;
    }
  }

  /**
   * Delete a contact message (admin only)
   * @param {string} id - Message ID
   */
  async deleteMessage(id) {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(`/api/messages/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to delete message");
      }
      return await response.json();
    } catch (error) {
      logger.error("AuthService.deleteMessage error", error);
      throw error;
    }
  }

  /**
   * Update message status (admin only)
   * @param {string} id - Message ID
   * @param {string} status - New status
   */
  async updateMessageStatus(id, status) {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(`/api/messages/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        throw new Error("Failed to update message status");
      }
      return await response.json();
    } catch (error) {
      logger.error("AuthService.updateMessageStatus error", error);
      throw error;
    }
  }
}

export const authService = new AuthService();
