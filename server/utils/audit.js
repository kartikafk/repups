import AuditLog from "../models/AuditLog.js";

export function audit(req, action, targetType, targetId, metadata = {}) {
  return AuditLog.create({ adminId: req.user.id, action, targetType, targetId: String(targetId), ip: req.ip, metadata })
    .catch((error) => req.log?.error?.(error, "Failed to write audit log"));
}
