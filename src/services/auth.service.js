import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth, db } from "../lib/firebase/client";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { logger } from "../lib/logger/logger";

class AuthService {
  /**
   * Register a new user
   * @param {string} email
   * @param {string} password
   * @param {string} name
   */
  async register(email, password, name) {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Update display name
      await updateProfile(user, { displayName: name });

      // Create user document in Firestore
      await this.createUserDocument(user, { name, role: "user" });

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
   * Create user document in Firestore
   * @param {object} user Firebase user object
   * @param {object} additionalData
   */
  async createUserDocument(user, additionalData = {}) {
    if (!user) return;

    const userRef = doc(db, "users", user.uid);
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
