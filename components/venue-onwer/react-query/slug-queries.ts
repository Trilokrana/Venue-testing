import { checkSlugExists } from "@/lib/venues/actions"
import { useMutation } from "@tanstack/react-query"

export const useCheckSlugExistsMutation = () => {
  return useMutation({
    mutationKey: ["check-slug-exists"],
    mutationFn: async (slug: string) => {
      return await checkSlugExists(slug)
    },
    onSuccess: () => {},
  })
}
