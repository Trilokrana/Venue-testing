import { DataTablePagination } from "@/components/data-table/data-table-pagination"
import { NoData } from "@/components/no-data"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getCommonPinningStyles } from "@/lib/data-table"
import { cn } from "@/lib/utils"
import { flexRender, type Row, type Table as TanstackTable } from "@tanstack/react-table"
import Image from "next/image"
import type * as React from "react"
import { Fragment, type ReactNode } from "react"
import { Skeleton } from "../ui/skeleton"

interface DataTableProps<TData> extends React.ComponentProps<"div"> {
  table: TanstackTable<TData>
  actionBar?: React.ReactNode
  isLoading?: boolean
  containerClassName?: string
  noDataText?: string
  /** Renders custom content when a row is expanded. Omit to disable row expansion UI. */
  renderExpandedRow?: (row: Row<TData>) => ReactNode
}

export function DataTable<TData>({
  table,
  actionBar,
  children,
  className,
  containerClassName,
  isLoading = false,
  noDataText,
  renderExpandedRow,
  ...props
}: DataTableProps<TData>) {
  const isEmpty = table.getRowModel().rows?.length === 0
  return (
    <div className="overflow-hidden rounded-lg border bg-card w-full">
      <div className="data-table-container p-2">
        <div className={cn("flex w-full flex-col gap-2.5", className)} {...props}>
          {children}
          <Table
            className="text-xs table-fixed w-full"
            containerClassName={cn(
              "relative min-h-[64vh] max-h-[64vh] rounded-md border w-full",
              isEmpty && "overflow-hidden overflow-x-hidden",
              containerClassName
            )}
          >
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      colSpan={header.colSpan}
                      style={{
                        ...getCommonPinningStyles({ column: header.column }),
                        position: "sticky",
                        top: 0,
                        zIndex: header.column.getIsPinned() ? 20 : 10,
                      }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            {isLoading ? (
              <TableBody>
                {Array.from({ length: 9 }).map((_, i) => (
                  <TableRow key={i} className="hover:bg-transparent">
                    {Array.from({ length: table.getAllColumns()?.length }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            ) : (
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <Fragment key={row.id}>
                      <TableRow data-state={row.getIsSelected() ? "selected" : undefined}>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell
                            key={cell.id}
                            style={{
                              ...getCommonPinningStyles({ column: cell.column }),
                            }}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                      {renderExpandedRow && row.getCanExpand?.() && row.getIsExpanded?.() && (
                        <TableRow
                          key={`${row.id}-expanded`}
                          className="bg-muted/30 hover:bg-muted/30"
                        >
                          <TableCell
                            colSpan={table.getAllColumns().length}
                            className="p-0 align-top"
                          >
                            {renderExpandedRow(row)}
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  ))
                ) : (
                  <TableRow>
                    <TableCell>
                      <></>
                      <div className="grid gap-1 place-items-center min-h-[54dvh] w-[86dvw] md:w-[77dvw]">
                        <div className="h-fit flex flex-col items-center justify-center gap-2">
                          {table.getState().columnFilters.length > 0 ? (
                            <>
                              <Image
                                src="/images/no-data-concept.png"
                                alt="No Data"
                                width={200}
                                height={200}
                              />
                              <h4 className="scroll-m-20 text-xl font-medium tracking-tight text-muted-foreground">
                                {noDataText ? noDataText : "No Data Found."}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                No items Match. Try different keywords or check Filters.
                              </p>
                            </>
                          ) : (
                            <>
                              <NoData />
                              <h4 className="scroll-m-20 text-xl font-medium tracking-tight text-muted-foreground">
                                {noDataText ? noDataText : "No Data Found."}
                              </h4>
                            </>
                          )}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            )}
          </Table>
          <div className="flex flex-col gap-2.5">
            <DataTablePagination table={table} />
            {actionBar && table.getFilteredSelectedRowModel().rows.length > 0 && actionBar}
          </div>
        </div>
      </div>
    </div>
  )
}
