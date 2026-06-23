import { useAuth } from '../context/AuthContext';

const HIDDEN_FOR_STAFF = [
  "users",
  "reference-master",
  "system-info-master",
  "db-copy",
  "restore-db",
  "receipt-entry",
  "receipt-details",
  "voucher-entry",
  "day-report",
  "day-book",
  "ledger-balance",
  "monthly-ledger-balance",
  "outstanding-receipt-report",
  "payment-entry",
  "payment-details",
  "journal-entry",
];

const HIDDEN_FOR_USER = [
  ...HIDDEN_FOR_STAFF,
  "company-master", "employee-master", "ledger-group-master", "machine-master", "contractor-master", "process-master", "part-usage-list", "qc-check-method", "qc-inspection-char", "qc-standard-master", "auto-po",
  "part-number-base", "tax-ledger", "tax-master-menu", "item-group", "item-master",
  "supplier-master", "customer-master", "vehicle-master",
  "quotation-entry", "quotation-details", "marketing-log",
  "purchase-order", "purchase-order-details", "purchase-request", "print-purchase-request",
  "material-request", "print-material-request", "gate-entry", "gate-entry-report", "grn-entry", "grn-entry-report",
  "bom-creation", "customerwise-bom-report", "index-creation", "index-creation-report", "upload-bom", "main-index", "main-index-report", "view-model",
  "customer-complaint-entry", "ccms-entry-details", "dc-entry", "dc-details-report",
  "breakdown-approval-list", "nc-approval", "nc-job-created", "nc-dc-entry", "nc-dc-details",
  "barcode-details", "auto-job-entry", "service-job-entry-details", "conformation-list", "conformation-entry-details",
  "job-card-entry", "process-menu", "tech-auto-job", "view-job-status", "waiting-for-approval", "update-route-details", "process-completed", "mr-approval", "nc-job-created", "nc-approval", "ipr-approval", "job-qty-mismatch", "process-card-close", "job-qc-entry",
  "credit-sales", "sales-details", "quotation-sales", "quotation-details", "dc-sales", "dc-details", "service-bill-entry", "service-bill-details", "service-labour-bill-details", "temp-service-bill-details",
];

export function useModulePermission(moduleCode) {
  const { auth } = useAuth();
  const user = auth?.user;

  if (!user) {
    return {
      canDisplay: false,
      canSave: false,
      canEdit: false,
      canDelete: false,
      canPrint: false,
    };
  }

  const roleUpper = (user.role || '').toUpperCase();

  // Admin bypass
  if (roleUpper === 'ADMIN' || user.id === 0) {
    return {
      canDisplay: true,
      canSave: true,
      canEdit: true,
      canDelete: true,
      canPrint: true,
    };
  }

  // If custom permissions exist for this user, use them
  if (user.permissions && user.permissions.length > 0) {
    const perm = user.permissions.find((p) => p.module === moduleCode);
    return {
      canDisplay: perm ? !!perm.canDisplay : false,
      canSave: perm ? !!perm.canSave : false,
      canEdit: perm ? !!perm.canEdit : false,
      canDelete: perm ? !!perm.canDelete : false,
      canPrint: perm ? !!perm.canPrint : false,
    };
  }

  // Fallback: Hybrid Access Policy (evaluate role restrictions)
  if (roleUpper === 'USER') {
    const isAllowed = !HIDDEN_FOR_USER.includes(moduleCode);
    return {
      canDisplay: isAllowed,
      canSave: isAllowed,
      canEdit: isAllowed,
      canDelete: isAllowed,
      canPrint: isAllowed,
    };
  }
  if (roleUpper === 'STAFF') {
    const isAllowed = !HIDDEN_FOR_STAFF.includes(moduleCode);
    return {
      canDisplay: isAllowed,
      canSave: isAllowed,
      canEdit: isAllowed,
      canDelete: isAllowed,
      canPrint: isAllowed,
    };
  }

  // For any other role, if no database permissions are configured, they are unauthorized by default
  return {
    canDisplay: false,
    canSave: false,
    canEdit: false,
    canDelete: false,
    canPrint: false,
  };
}
