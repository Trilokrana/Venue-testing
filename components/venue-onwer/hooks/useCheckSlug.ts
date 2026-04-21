import { useCheckSlugExistsMutation } from "../react-query/slug-queries"

export const useCheckSlugExists = () => {
  const { mutate, mutateAsync, isPending, ...rest } = useCheckSlugExistsMutation()
  return {
    mutate,
    mutateAsync,
    isPending,
    ...rest,
  }
}
