/**
 * PHILOZZ CMS — Strict Media Security & Validation Rules
 * Phase 16E.0: Media Library Foundation & Storage Provider Readiness
 *
 * Enforces strict verification of upload signing requests:
 * 1. Allowlisted MIME types (JPEG, PNG, WebP, SVG, GIF, PDF)
 * 2. Extension matching declared MIME type
 * 3. Strict rejection of executable and script extensions (.exe, .sh, .php, .html, .js, etc.)
 * 4. SVG sanitization & malicious script payload detection
 * 5. Maximum file size constraints (15MB max)
 * 6. Target folder whitelist (projects, articles, photos, brand, general)
 */

import { MediaFolder } from '../models/media';
import { ValidationResult } from './validators';

export const ALLOWED_MEDIA_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
  'image/gif',
  'application/pdf',
]);

export const ALLOWED_RASTER_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

export const MIME_TO_EXTENSIONS: Record<string, string[]> = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/svg+xml': ['.svg'],
  'image/gif': ['.gif'],
  'application/pdf': ['.pdf'],
};

/**
 * Validates binary magic bytes from the first 16 bytes of a file.
 * Strictly verifies real file characteristics rather than trusting client-reported MIME or extension.
 */
export function validateImageMagicBytes(buffer: Uint8Array): {
  valid: boolean;
  detectedFormat?: string;
  error?: string;
} {
  if (buffer.length < 4) {
    return { valid: false, error: 'File buffer too short to verify image header.' };
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { valid: true, detectedFormat: 'image/jpeg' };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { valid: true, detectedFormat: 'image/png' };
  }

  // GIF: GIF87a or GIF89a (47 49 46 38 37 61 or 47 49 46 38 39 61)
  if (
    buffer.length >= 6 &&
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38 &&
    (buffer[4] === 0x37 || buffer[4] === 0x39) &&
    buffer[5] === 0x61
  ) {
    return { valid: true, detectedFormat: 'image/gif' };
  }

  // WebP: RIFF (52 49 46 46) .... WEBP (57 45 42 50)
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { valid: true, detectedFormat: 'image/webp' };
  }

  return {
    valid: false,
    error: 'File header magic bytes do not match any allowed raster image format (JPEG, PNG, WebP, GIF).',
  };
}

/**
 * Validates binary header magic bytes for PDF files.
 * Verifies standard PDF signature: %PDF- (0x25, 0x50, 0x44, 0x46, 0x2D).
 */
export function validatePdfMagicBytes(buffer: Uint8Array): {
  valid: boolean;
  detectedFormat?: string;
  error?: string;
} {
  if (buffer.length < 5) {
    return { valid: false, error: 'File buffer too short to verify PDF header signature.' };
  }

  // PDF signature: %PDF- (0x25, 0x50, 0x44, 0x46, 0x2D)
  if (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46 &&
    buffer[4] === 0x2d
  ) {
    return { valid: true, detectedFormat: 'application/pdf' };
  }

  return {
    valid: false,
    error: 'File header magic bytes do not match valid PDF signature (%PDF-).',
  };
}

/**
 * Validates media header signatures based on declared MIME type.
 */
export function validateMediaMagicBytes(
  buffer: Uint8Array,
  mimeType?: string
): {
  valid: boolean;
  detectedFormat?: string;
  error?: string;
} {
  if (mimeType === 'application/pdf') {
    return validatePdfMagicBytes(buffer);
  }
  return validateImageMagicBytes(buffer);
}

export const FORBIDDEN_EXECUTABLE_EXTENSIONS = new Set([
  '.exe',
  '.bat',
  '.cmd',
  '.sh',
  '.bash',
  '.php',
  '.php3',
  '.php4',
  '.php5',
  '.phtml',
  '.pl',
  '.py',
  '.js',
  '.mjs',
  '.cjs',
  '.ts',
  '.html',
  '.htm',
  '.xhtml',
  '.jar',
  '.apk',
  '.bin',
  '.msi',
  '.dll',
  '.so',
  '.com',
  '.vbs',
  '.ps1',
  '.scr',
]);

export const MAX_MEDIA_FILE_SIZE =
  Number(process.env.MAX_MEDIA_FILE_SIZE_BYTES) || 15 * 1024 * 1024; // 15MB default

export const MAX_PDF_FILE_SIZE =
  Number(process.env.MAX_PDF_FILE_SIZE_BYTES) || 10 * 1024 * 1024; // 10MB default (configurable)

export const ALLOWED_MEDIA_FOLDERS: MediaFolder[] = [
  'projects',
  'articles',
  'photos',
  'brand',
  'general',
];

export interface UploadSigningRequest {
  filename: string;
  mimeType: string;
  folder: MediaFolder;
  sizeBytes: number;
}

/**
 * Checks if a string contains malicious SVG script content or event handlers.
 */
export function containsMaliciousSvgContent(svgText: string): boolean {
  if (!svgText || typeof svgText !== 'string') return false;
  const lower = svgText.toLowerCase();

  const dangerousPatterns = [
    /<script\b/i,
    /<\/script>/i,
    /javascript:/i,
    /vbscript:/i,
    /data:text\/html/i,
    /\bon\w+\s*=/i, // onload=, onerror=, onclick=, etc.
    /<foreignobject\b/i,
    /<iframe\b/i,
    /<embed\b/i,
    /<object\b/i,
    /xlink:href=["']\s*javascript:/i,
    /href=["']\s*javascript:/i,
  ];

  return dangerousPatterns.some((pattern) => pattern.test(lower));
}

/**
 * Validates an upload signing authorization request.
 */
export function validateUploadSigningRequest(
  input: Partial<UploadSigningRequest>,
  options?: { allowDocuments?: boolean }
): ValidationResult {
  const errors: Record<string, string> = {};

  // 1. Filename validation
  if (!input.filename || typeof input.filename !== 'string' || !input.filename.trim()) {
    errors.filename = 'Filename is required.';
  } else {
    const filename = input.filename.trim();

    // Check for directory traversal or illegal characters
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      errors.filename = 'Filename cannot contain directory traversal sequences or path separators.';
    } else if (!/^[a-zA-Z0-9_\-.]+\.[a-zA-Z0-9]+$/.test(filename)) {
      errors.filename = 'Filename contains invalid characters. Use alphanumeric, dash, underscore, and dot only.';
    } else if (filename.length > 255) {
      errors.filename = 'Filename cannot exceed 255 characters.';
    }

    // Check extension
    const extMatch = filename.match(/\.[a-zA-Z0-9]+$/);
    const ext = extMatch ? extMatch[0].toLowerCase() : '';

    if (FORBIDDEN_EXECUTABLE_EXTENSIONS.has(ext)) {
      errors.filename = `Security violation: Executable or script file extension "${ext}" is strictly forbidden.`;
    }

    // Reject SVG explicitly for security
    if (ext === '.svg' || input.mimeType === 'image/svg+xml') {
      errors.filename = 'SVG uploads are strictly rejected for security (anti-script injection).';
    }

    // Reject PDF if documents are explicitly disabled
    if (ext === '.pdf' || input.mimeType === 'application/pdf') {
      if (options?.allowDocuments === false) {
        errors.filename = 'PDF document uploads are disabled by options.';
      }
    }

    // Verify extension matches declared MIME type
    if (input.mimeType && MIME_TO_EXTENSIONS[input.mimeType]) {
      const validExtensions = MIME_TO_EXTENSIONS[input.mimeType];
      if (!validExtensions.includes(ext)) {
        errors.filename = `File extension "${ext}" does not match declared MIME type "${input.mimeType}". Expected: ${validExtensions.join(', ')}.`;
      }
    }
  }

  // 2. MIME type validation
  const isPdf =
    input.mimeType === 'application/pdf' ||
    (typeof input.filename === 'string' && input.filename.trim().toLowerCase().endsWith('.pdf'));

  if (!input.mimeType || typeof input.mimeType !== 'string') {
    errors.mimeType = 'MIME type is required.';
  } else if (input.mimeType === 'image/svg+xml') {
    errors.mimeType = 'SVG uploads are strictly rejected for security (anti-script injection).';
  } else if (isPdf) {
    if (options?.allowDocuments === false) {
      errors.mimeType = 'PDF uploads are disabled by options.';
    } else if (input.mimeType !== 'application/pdf') {
      errors.mimeType = 'PDF files must have MIME type "application/pdf".';
    }
  } else if (!ALLOWED_RASTER_IMAGE_MIME_TYPES.has(input.mimeType)) {
    errors.mimeType = `MIME type "${input.mimeType}" is not supported. Allowed formats: JPEG, PNG, WEBP, GIF, PDF.`;
  }

  // 3. Folder validation
  if (!input.folder || !ALLOWED_MEDIA_FOLDERS.includes(input.folder)) {
    errors.folder = `Folder must be one of: ${ALLOWED_MEDIA_FOLDERS.join(', ')}.`;
  }

  // 4. File size validation
  const maxSize = isPdf ? MAX_PDF_FILE_SIZE : MAX_MEDIA_FILE_SIZE;
  const maxLabel = isPdf ? `${(MAX_PDF_FILE_SIZE / (1024 * 1024)).toFixed(0)}MB` : '15MB';

  if (typeof input.sizeBytes !== 'number' || isNaN(input.sizeBytes) || input.sizeBytes <= 0) {
    errors.sizeBytes = 'Valid file size in bytes is required.';
  } else if (input.sizeBytes > maxSize) {
    errors.sizeBytes = `File size ${(input.sizeBytes / (1024 * 1024)).toFixed(1)}MB exceeds maximum allowed limit of ${maxLabel}.`;
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export interface VerifyPdfSignatureResult {
  valid: boolean;
  error?: string;
  bytesRead?: number;
}

/**
 * Server-side mandatory verification of remote PDF files.
 * Streams bounded initial bytes (up to maxBytes) and validates %PDF- magic bytes signature.
 * Fail-closed: returns valid: false if HTTP status is not ok (e.g. 503, 404), network error occurs,
 * timeout triggers, or file contains invalid signature / < 5 bytes.
 */
export async function verifyRemotePdfSignature(
  url: string,
  options?: { timeoutMs?: number; maxBytes?: number; fetchFn?: typeof fetch }
): Promise<VerifyPdfSignatureResult> {
  const timeoutMs = options?.timeoutMs ?? 5000;
  const maxBytes = options?.maxBytes ?? 64;
  const fetcher =
    options?.fetchFn ??
    (typeof fetch !== 'undefined'
      ? fetch
      : typeof globalThis !== 'undefined'
      ? (globalThis as unknown as { fetch?: typeof fetch }).fetch
      : undefined);

  if (!fetcher) {
    return {
      valid: false,
      error: 'Remote PDF inspection failed: Fetch API is unavailable in runtime environment.',
    };
  }

  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeoutId = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

  try {
    const response = await fetcher(url, {
      headers: { Range: `bytes=0-${maxBytes - 1}` },
      signal: controller?.signal,
    });

    if (!response || !response.ok) {
      const status = response ? response.status : 'Unknown';
      return {
        valid: false,
        error: `Remote PDF inspection failed: Server returned HTTP ${status}.`,
      };
    }

    let buffer: Uint8Array;

    // Stream bounded bytes without buffering entire response in memory
    if (response.body && typeof response.body.getReader === 'function') {
      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let totalBytes = 0;

      try {
        while (totalBytes < maxBytes) {
          const { done, value } = await reader.read();
          if (done || !value) break;
          chunks.push(value);
          totalBytes += value.length;
          if (totalBytes >= maxBytes) break;
        }
      } finally {
        try {
          await reader.cancel();
        } catch {
          // Ignore cancellation errors
        }
      }

      buffer = new Uint8Array(totalBytes);
      let offset = 0;
      for (const chunk of chunks) {
        const slice = chunk.subarray(0, Math.min(chunk.length, totalBytes - offset));
        buffer.set(slice, offset);
        offset += slice.length;
        if (offset >= totalBytes) break;
      }
    } else if (typeof response.arrayBuffer === 'function') {
      const ab = await response.arrayBuffer();
      buffer = new Uint8Array(ab);
    } else {
      return {
        valid: false,
        error: 'Remote response does not support stream or arrayBuffer reading.',
      };
    }

    if (buffer.length < 5) {
      return {
        valid: false,
        error: `Remote file buffer too short (${buffer.length} bytes) to verify PDF signature.`,
        bytesRead: buffer.length,
      };
    }

    const check = validatePdfMagicBytes(buffer);
    if (!check.valid) {
      return {
        valid: false,
        error: check.error || 'Remote file lacks a valid PDF header signature (%PDF-).',
        bytesRead: buffer.length,
      };
    }

    return {
      valid: true,
      bytesRead: buffer.length,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const isTimeout =
      err instanceof Error &&
      (err.name === 'AbortError' || message.includes('aborted') || message.includes('timeout'));
    return {
      valid: false,
      error: isTimeout
        ? `Remote PDF signature inspection timed out after ${timeoutMs}ms.`
        : `Remote PDF signature inspection network failure: ${message}`,
    };
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

