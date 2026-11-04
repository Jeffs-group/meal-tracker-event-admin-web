import { z } from "zod";

// Name regex: letters, spaces, dots, hyphens, and apostrophes
export const userNameRegex = /^[a-zA-Z\s.'-]+$/;

// Phone: E.164 with optional spaces/dashes, must start with + and country code
export const phoneRegex = /^\+?[1-9]\d{1,14}$/;

export const userFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(60, "Full name must be at most 60 characters")
    .regex(
      userNameRegex,
      "Name can only contain letters, spaces, dots, hyphens, and apostrophes",
    ),
  email: z
    .string()
    .trim()
    .min(1, "Email address is required")
    .email("Please provide a valid work email address"),
  contact: z
    .string()
    .trim()
    .min(1, "Contact phone number is required")
    .refine((val) => {
      // Strip spaces, dashes, parentheses to validate E.164 length
      const cleaned = val.replace(/[\s\-()]/g, "");
      return (
        phoneRegex.test(cleaned) && cleaned.length >= 10 && cleaned.length <= 16
      );
    }, "Please enter a valid international phone number (e.g. +91 98765 43210)"),
  roleId: z.string().min(1, "Please assign a role to this user"),
});

export type UserFormValues = z.infer<typeof userFormSchema>;

export const roleFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Role name must be at least 2 characters")
    .max(40, "Role name must be at most 40 characters"),
  description: z
    .string()
    .trim()
    .max(160, "Description cannot exceed 160 characters")
    .optional()
    .default(""),
});

export type RoleFormValues = z.infer<typeof roleFormSchema>;
