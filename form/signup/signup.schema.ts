import z from "zod"

export const SignupSchema = z
  .object({
    first_name: z.string().trim().min(3, "Min 3 characters").max(50, "Max 50 characters"),

    last_name: z.string().trim().min(3, "Min 3 characters").max(50, "Max 50 characters"),

    email: z.string().trim().toLowerCase().email("Invalid email"),

    password: z
      .string()
      .min(6, "Min 6 characters")
      .max(20, "Max 20 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+=\-{}[\]|:;"'<>,./]).*$/,
        "Must include upper, lower, number & symbol"
      ),

    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  })
