import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

export const validateRequest = <T>(
  schema: z.ZodSchema<T>,
  data: unknown
): T => {
  return schema.parse(data);
};

export const profileValidationSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required")
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name must be less than 50 characters")
    .regex(
      /^[a-zA-Z\s'-]+$/,
      "First name can only contain letters, spaces, hyphens, and apostrophes"
    ),

  lastName: z
    .string()
    .min(1, "Last name is required")
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name must be less than 50 characters")
    .regex(
      /^[a-zA-Z\s'-]+$/,
      "Last name can only contain letters, spaces, hyphens, and apostrophes"
    ),

  displayName: z
    .string()
    .max(100, "Display name must be less than 100 characters")
    .optional(),

  phone: z
    .string()
    .regex(
      /^[\d\s\-\(\)\+]+$/,
      "Phone number can only contain digits, spaces, hyphens, parentheses, and plus signs"
    )
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number must be less than 15 digits")
    .optional()
    .or(z.literal("")),

  location: z
    .string()
    .max(100, "Location must be less than 100 characters")
    .optional(),

  website: z.url("Please enter a valid URL").optional().or(z.literal("")),

  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),

  countryCode: z.string().optional(),
});

export type ProfileFormData = z.infer<typeof profileValidationSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
