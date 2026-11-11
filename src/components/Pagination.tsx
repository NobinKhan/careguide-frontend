export interface PaginationProps {
  page: number;
  totalPages: number;
  total?: number;
  totalItems?: number;
  itemLabel?: string;
  label?: string;
  onPageChange: (newPage: number) => void;
}

export function Pagination(props: PaginationProps) {
  const itemLabel = () => props.itemLabel ?? props.label ?? 'items';
  const count = () => props.total ?? props.totalItems ?? 0;

  return (
    <div class="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 text-xs text-slate-500">
      <div>
        Page {props.page} of {Math.max(1, props.totalPages)} · {count()} {itemLabel()}
      </div>
      <div class="flex items-center gap-2">
        <button
          type="button"
          onClick={() => props.onPageChange(props.page - 1)}
          disabled={props.page <= 1}
          class="btn btn-secondary px-3 py-1.5 text-xs min-h-[32px]"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={() => props.onPageChange(props.page + 1)}
          disabled={props.page >= props.totalPages}
          class="btn btn-secondary px-3 py-1.5 text-xs min-h-[32px]"
        >
          Next
        </button>
      </div>
    </div>
  );
}
