import { InvoiceStatus } from '../types';

export function formatCurrency(amount: number | undefined | null, currency = 'USD'): string {
  if (amount == null) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}

export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function formatNumber(n: number | undefined | null, decimals = 0): string {
  if (n == null) return '—';
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(n);
}

export function formatPercent(n: number | undefined | null): string {
  if (n == null) return '—';
  return `${n.toFixed(1)}%`;
}

export function truncate(str?: string, len = 30): string {
  if (!str) return '—';
  return str.length > len ? `${str.slice(0, len)}…` : str;
}

export function riskColor(level?: string): 'error' | 'warning' | 'info' | 'success' {
  switch (level) {
    case 'critical': return 'error';
    case 'high':     return 'error';
    case 'medium':   return 'warning';
    case 'low':      return 'success';
    default:         return 'info';
  }
}

export function statusColor(status?: InvoiceStatus): 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' {
  switch (status) {
    case 'approved':        return 'success';
    case 'rejected':        return 'error';
    case 'fraud_suspected': return 'error';
    case 'on_hold':         return 'warning';
    case 'pending_review':  return 'warning';
    case 'processing':      return 'info';
    case 'uploaded':        return 'default';
    default:                return 'primary';
  }
}

export function statusLabel(status?: InvoiceStatus): string {
  switch (status) {
    case 'uploaded':        return 'Uploaded';
    case 'processing':      return 'Processing';
    case 'ocr_complete':    return 'OCR Complete';
    case 'duplicate_check': return 'Duplicate Check';
    case 'fraud_check':     return 'Fraud Check';
    case 'pending_review':  return 'Pending Review';
    case 'approved':        return 'Approved';
    case 'rejected':        return 'Rejected';
    case 'fraud_suspected': return 'Fraud Suspected';
    case 'on_hold':         return 'On Hold';
    default:                return status || 'Unknown';
  }
}

export function getInitials(firstName?: string, lastName?: string): string {
  return `${(firstName?.[0] || '').toUpperCase()}${(lastName?.[0] || '').toUpperCase()}`;
}

export function bytesToSize(bytes?: number): string {
  if (!bytes) return '—';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}
