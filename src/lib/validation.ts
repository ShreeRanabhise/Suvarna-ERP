import { z } from 'zod'

// Verhoeff Algorithm Tables for Aadhaar Checksum Validation
const dTable = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
]

const pTable = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
]

/**
 * Validates a number string using the Verhoeff checksum algorithm.
 */
export function validateVerhoeff(str: string): boolean {
  if (!/^\d+$/.test(str)) return false
  let c = 0
  const myArray = str.split('').map(Number).reverse()
  for (let i = 0; i < myArray.length; i++) {
    c = dTable[c][pTable[i % 8][myArray[i]]]
  }
  return c === 0
}

/**
 * Validates an Indian PAN card number format (5 letters, 4 numbers, 1 letter).
 */
export function validatePAN(pan: string): boolean {
  if (!pan) return true
  return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan.toUpperCase())
}

/**
 * Mask Aadhaar number for security (e.g., XXXX XXXX 1234).
 */
export function maskAadhaar(aadhaar: string | null | undefined): string {
  if (!aadhaar) return 'N/A'
  const clean = aadhaar.replace(/\D/g, '')
  if (clean.length < 4) return aadhaar
  return `XXXX XXXX ${clean.slice(-4)}`
}

/**
 * Mask PAN number for security (e.g., ABCDE****F).
 */
export function maskPAN(pan: string | null | undefined): string {
  if (!pan) return 'N/A'
  const clean = pan.trim().toUpperCase()
  if (clean.length !== 10) return pan
  return `${clean.slice(0, 5)}****${clean.slice(-1)}`
}

export function formatAadhaar(aadhaar: string | null | undefined): string {
  if (!aadhaar) return 'N/A'
  const clean = aadhaar.replace(/\D/g, '')
  if (clean.length === 12) {
    return `${clean.slice(0, 4)} ${clean.slice(4, 8)} ${clean.slice(8, 12)}`
  }
  return aadhaar
}

export function formatPAN(pan: string | null | undefined): string {
  if (!pan) return 'N/A'
  return pan.trim().toUpperCase()
}

// Enterprise Zod Schema Primitives
export const fullNameSchema = z
  .string()
  .trim()
  .min(3, "Enter customer's full name.")
  .max(100, "Name cannot exceed 100 characters.")
  .regex(/^[a-zA-Z\s.]+$/, "Full name can only contain letters, spaces, and periods.")

export const nameSchema = fullNameSchema

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^[6-9]\d{9}$/, 'Enter a valid mobile number.')

export const aadhaarSchema = z
  .string()
  .trim()
  .transform((val) => val.replace(/\s+/g, ''))
  .refine((val) => /^[0-9]{12}$/.test(val), 'Enter a valid Aadhaar number.')
  .refine((val) => !/^(\d)\1{11}$/.test(val), 'Invalid Aadhaar checksum.')
  .refine((val) => validateVerhoeff(val), 'Invalid Aadhaar checksum.')

export const panSchema = z
  .string()
  .trim()
  .transform((val) => val.toUpperCase())
  .refine((val) => val === '' || /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(val), {
    message: 'Enter a valid PAN number.'
  })

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .refine((val) => val === '' || z.string().email().safeParse(val).success, {
    message: 'Please enter a valid email address'
  })

export const addressSchema = z
  .string()
  .trim()
  .min(10, 'Address must contain at least 10 characters.')
  .max(500, 'Address cannot exceed 500 characters.')
