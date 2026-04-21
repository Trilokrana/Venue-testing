import z from "zod"
import { SignupSchema } from "./signup.schema"

export type SignFormValues = z.infer<typeof SignupSchema>

export type SignFormProps = {}

export type StrengthScore = 0 | 1 | 2 | 3 | 4 | 5

export type Requirement = {
  met: boolean
  text: string
}

export type PasswordStrength = {
  score: StrengthScore
  requirements: Requirement[]
}
