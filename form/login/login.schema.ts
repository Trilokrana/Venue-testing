import { z } from "zod"

export const LoginSchema = z.object({
  email: z.string().trim().toLowerCase().min(1, "Email required").email("Invalid email"),

  password: z
    .string()
    .min(1, "Password required")
    .min(6, "Min 6 characters")
    .max(20, "Max 20 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+=\-{}[\]|:;"'<>,./]).*$/,
      "Must include upper, lower, number & symbol"
    ),
})
