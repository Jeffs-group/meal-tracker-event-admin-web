import { z } from "zod";
import { PHOTO_CONSTRAINTS } from "@/constants/publicRegistration";

/**
 * Normalizes input phone to standard 10-digit Indian mobile number
 * Accepts formats: "+91 98765 43210", "09876543210", "98765-43210", "+919876543210"
 */
export function normalizeIndiaPhone(raw: string): {
  valid: boolean;
  e164: string;
  tenDigit: string;
  error?: string;
} {
  // Strip all whitespace, hyphens, parentheses, and dots
  let cleaned = raw.replace(/[\s\-().]/g, "");

  // Strip leading +91 or 91 if present and length > 10
  if (cleaned.startsWith("+91")) {
    cleaned = cleaned.slice(3);
  } else if (cleaned.startsWith("91") && cleaned.length === 12) {
    cleaned = cleaned.slice(2);
  } else if (cleaned.startsWith("0") && cleaned.length === 11) {
    cleaned = cleaned.slice(1);
  }

  // Check 10-digit format starting with 6, 7, 8, or 9
  const isValid = /^[6-9]\d{9}$/.test(cleaned);

  if (!isValid) {
    return {
      valid: false,
      e164: "",
      tenDigit: cleaned,
      error:
        "Please enter a valid 10-digit Indian mobile number starting with 6-9.",
    };
  }

  return {
    valid: true,
    e164: `+91${cleaned}`,
    tenDigit: cleaned,
  };
}

/**
 * Checks magic bytes of file to verify real file format (rejects renamed/spoofed files)
 */
export async function verifyPhotoMagicBytes(file: File): Promise<{
  valid: boolean;
  detectedType?: string;
  error?: string;
}> {
  try {
    const buffer = await file.slice(0, 8).arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // PNG: 89 50 4E 47 0D 0A 1A 0A
    const isPng =
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47;

    // JPEG / JPG: FF D8 FF
    const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;

    if (isPng) {
      return { valid: true, detectedType: "image/png" };
    }
    if (isJpeg) {
      return { valid: true, detectedType: "image/jpeg" };
    }

    return {
      valid: false,
      error:
        "Unsupported file content. Please upload a genuine JPG or PNG image.",
    };
  } catch {
    return {
      valid: false,
      error: "Unable to inspect file headers. Please re-select the image.",
    };
  }
}

/**
 * Client-side photo dimensions decode check (min 600 x 600 px)
 */
export function verifyPhotoDimensions(
  dataUrl: string,
  minPx = PHOTO_CONSTRAINTS.MIN_PX,
): Promise<{ valid: boolean; width: number; height: number; error?: string }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const { width, height } = img;
      if (width < minPx || height < minPx) {
        resolve({
          valid: false,
          width,
          height,
          error: `Photo dimensions are ${width}×${height}px. Official accreditation requires a minimum resolution of ${minPx}×${minPx}px.`,
        });
      } else {
        resolve({ valid: true, width, height });
      }
    };
    img.onerror = () => {
      resolve({
        valid: false,
        width: 0,
        height: 0,
        error: "Unable to read image dimensions. Please select a valid photo.",
      });
    };
    img.src = dataUrl;
  });
}

/**
 * Masks an email for public receipt display: e.g. "john.smith@example.com" -> "j***h@example.com"
 */
export function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!user || !domain) return email;
  if (user.length <= 2) {
    return `${user[0]}*@${domain}`;
  }
  const first = user[0];
  const last = user[user.length - 1];
  return `${first}${"*".repeat(Math.min(user.length - 2, 4))}${last}@${domain}`;
}

/**
 * Zod Schema for Public Meal Registration Form
 */
export const publicRegistrationFormSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Full name must be at least 2 characters.")
      .max(60, "Full name cannot exceed 60 characters.")
      .regex(
        /^[a-zA-Z\s.'-]+$/,
        "Full name can only contain letters, spaces, hyphens, apostrophes, and dots.",
      ),

    registrantType: z.enum(
      ["PLAYER", "COACH", "OWNER", "STAFF", "ORGANIZER", "OTHERS"],
      {
        errorMap: () => ({ message: "Please select your participation role." }),
      },
    ),

    league: z.enum(["KSPL", "ISCL"]).optional().or(z.literal("")),

    teamId: z.string().optional().or(z.literal("")),

    contactNumber: z
      .string()
      .min(10, "Contact number is required.")
      .refine((val) => normalizeIndiaPhone(val).valid, {
        message:
          "Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).",
      }),

    emailAddress: z
      .string()
      .trim()
      .min(1, "Email address is required.")
      .email("Please enter a valid email address.")
      .toLowerCase(),

    dateOfBirth: z
      .string()
      .min(1, "Date of birth is required.")
      .refine((val) => {
        const date = new Date(val);
        if (isNaN(date.getTime())) return false;
        const today = new Date();
        if (date > today) return false;
        // Reject age > 100
        const hundredYearsAgo = new Date();
        hundredYearsAgo.setFullYear(today.getFullYear() - 100);
        return date >= hundredYearsAgo;
      }, "Please enter a valid date of birth (must not be in future, maximum 100 years)."),

    mealPreference: z.enum(["VEG", "NON_VEG"], {
      errorMap: () => ({ message: "Please select your meal preference." }),
    }),

    photo: z.object({
      dataUrl: z.string().min(1, "Photo preview is missing."),
      fileName: z.string().min(1, "Photo file name is required."),
      fileSize: z
        .number()
        .max(PHOTO_CONSTRAINTS.MAX_BYTES, "Photo cannot exceed 5 MB."),
      dimensions: z.string().min(1, "Photo dimensions are required."),
      mimeType: z.string().min(1, "MIME type is required."),
      photoKey: z.string().optional(),
      photoDimensions: z.string().optional(),
      file: z.instanceof(File).optional(),
    }),

    consent: z.literal(true, {
      errorMap: () => ({
        message: "You must confirm that your details are accurate to proceed.",
      }),
    }),

    honeypot: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const isStaffOrOrganizer = ["STAFF", "ORGANIZER"].includes(
      data.registrantType,
    );
    if (!isStaffOrOrganizer) {
      if (!data.league || !["KSPL", "ISCL"].includes(data.league)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["league"],
          message: "Please select a participating league.",
        });
      }
      if (!data.teamId || data.teamId.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["teamId"],
          message: "Please choose your assigned team.",
        });
      }
    }
  });

export type PublicRegistrationFormValues = z.infer<
  typeof publicRegistrationFormSchema
>;
