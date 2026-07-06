export type FieldErrors = Record<string, string>;

export function validateEmail(email: string): string | null {
  if (!email.trim()) return "Email is required";
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(email)) return "Enter a valid email address";
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return "Password is required";
  if (password.length < 8) return "Password must be at least 8 characters";
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return "Password must include a letter and a number";
  }
  return null;
}

export function validateLoginForm(email: string, password: string): FieldErrors {
  const errors: FieldErrors = {};
  const e = validateEmail(email);
  if (e) errors.email = e;
  if (!password) errors.password = "Password is required";
  return errors;
}

export function validateSignupForm(email: string, password: string, confirm: string): FieldErrors {
  const errors: FieldErrors = {};
  const e = validateEmail(email);
  if (e) errors.email = e;
  const p = validatePassword(password);
  if (p) errors.password = p;
  if (confirm !== password) errors.confirm = "Passwords do not match";
  return errors;
}

export function validateResetForm(password: string, confirm: string): FieldErrors {
  const errors: FieldErrors = {};
  const p = validatePassword(password);
  if (p) errors.password = p;
  if (confirm !== password) errors.confirm = "Passwords do not match";
  return errors;
}

export interface BatchFormValues {
  name: string;
  source: string;
  wholesalerCost: string;
  shippingFees: string;
  packagingCost: string;
  otherCosts: string;
  totalUnits: string;
  targetPrice: string;
}

export function validateBatchForm(v: BatchFormValues): FieldErrors {
  const errors: FieldErrors = {};
  if (!v.name.trim()) errors.name = "Give this batch a name";

  const wholesaler = parseFloat(v.wholesalerCost || "0");
  if (v.wholesalerCost && (isNaN(wholesaler) || wholesaler < 0)) {
    errors.wholesalerCost = "Enter a valid amount";
  }

  const units = parseInt(v.totalUnits || "0", 10);
  if (!v.totalUnits || isNaN(units) || units <= 0) {
    errors.totalUnits = "Enter the number of units, greater than 0";
  }

  const target = parseFloat(v.targetPrice || "0");
  if (!v.targetPrice || isNaN(target) || target <= 0) {
    errors.targetPrice = "Enter a target price greater than 0";
  }

  const landedTotal =
    (parseFloat(v.wholesalerCost || "0") || 0) +
    (parseFloat(v.shippingFees || "0") || 0) +
    (parseFloat(v.packagingCost || "0") || 0) +
    (parseFloat(v.otherCosts || "0") || 0);
  if (landedTotal <= 0) {
    errors.wholesalerCost = errors.wholesalerCost || "Add at least one cost for this batch";
  }

  return errors;
}

export function validateSaleForm(units: string, price: string): FieldErrors {
  const errors: FieldErrors = {};
  const u = parseInt(units || "0", 10);
  if (!units || isNaN(u) || u <= 0) errors.units = "Enter units sold, greater than 0";
  const p = parseFloat(price || "0");
  if (!price || isNaN(p) || p < 0) errors.price = "Enter a valid price";
  return errors;
}
