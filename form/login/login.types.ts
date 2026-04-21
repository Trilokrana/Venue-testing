import z from "zod"
import { LoginSchema } from "./login.schema"

export type LoginFormValues = z.infer<typeof LoginSchema>

export type LoginFormProps = {

}