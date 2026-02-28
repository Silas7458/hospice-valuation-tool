/**
 * formatting.js — Display formatting utilities for the valuation tool UI.
 */

/**
 * Format a number as US currency: $1,234,567
 * Rounds to nearest whole dollar by default.
 */
export function formatCurrency(value, decimals = 0) {
  if (value == null || isNaN(value)) return '$0';
  const num = decimals === 0 ? Math.round(value) : value;
  return '$' + Number(num).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format a decimal as a percentage: 0.15 → "15.00%"
 */
export function formatPercent(value, decimals = 2) {
  if (value == null || isNaN(value)) return '0.00%';
  return (value * 100).toFixed(decimals) + '%';
}

/**
 * Format a number as a multiple: 4.75 → "4.75x"
 */
export function formatMultiple(value, decimals = 2) {
  if (value == null || isNaN(value)) return '0.00x';
  return Number(value).toFixed(decimals) + 'x';
}

/**
 * Format a number with thousands separators and fixed decimals.
 */
export function formatNumber(value, decimals = 2) {
  if (value == null || isNaN(value)) return '0';
  return Number(value).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
