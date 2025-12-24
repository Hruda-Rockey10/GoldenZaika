import { adminDb } from "@/lib/firebase/admin";
import { logger } from "@/lib/logger/logger";

class AuditService {
  /**
   * Log an admin action
   * @param {string} adminId - UID of the admin performing the action
   * @param {string} action - Action name (e.g., 'UPDATE_ORDER_STATUS')
   * @param {object} details - Target ID, changes, etc.
   */
  async logAction(adminId, action, details = {}) {
    try {
      await adminDb.collection("admin_logs").add({
        adminId,
        action,
        details,
        timestamp: new Date(),
      });
    } catch (error) {
      // Don't throw, just log error so we don't block the main flow
      logger.error("AuditService.logAction error", error);
    }
  }
}

export const auditService = new AuditService();
