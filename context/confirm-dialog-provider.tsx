"use client"

import {
  ConfirmDialogProvider as BaseConfirmDialogProvider,
  ConfirmOptions,
} from "@omit/react-confirm-dialog"

interface Props {
  children: React.ReactNode
  defaultOptions?: ConfirmOptions
}

export const ConfirmDialogProvider = ({ children, defaultOptions }: Props) => {
  return (
    <BaseConfirmDialogProvider
      defaultOptions={{
        confirmText: "Confirm",
        cancelText: "Cancel",
        confirmButton: {
          variant: "default",
        },
        cancelButton: {
          variant: "outline",
        },
        alertDialogContent: {
          className: "sm:max-w-[425px] rounded-lg",
        },
        alertDialogOverlay: {
          className: "bg-gray-500/50",
        },
        alertDialogFooter: {
          className: "gap-2",
        },
        ...defaultOptions,
      }}
    >
      {children}
    </BaseConfirmDialogProvider>
  )
}

export default ConfirmDialogProvider
