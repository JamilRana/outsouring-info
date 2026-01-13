// lib/validation.ts
import * as z from "zod";

export const submissionSchema = z.object({
  id: z.string(),
  p_designation: z.string().min(1, "Designation is required"),
  salary: z.number().positive("Salary must be positive"),
  total_post: z.number().int().positive("Total posts must be positive"),
  male: z.number().int().nonnegative("Male count cannot be negative"),
  female: z.number().int().nonnegative("Female count cannot be negative"),
});

export type SubmissionFormData = z.infer<typeof submissionSchema>;
