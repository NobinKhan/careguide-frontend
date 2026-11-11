import { Portal, type JSX } from '@solidjs/web';
import { createEffect, onCleanup, Show } from 'solid-js';

export interface ConfirmDialogProps {
  open?: boolean;
  isOpen?: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  variant?: 'danger' | 'default' | 'neutral';
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  children?: JSX.Element;
}

export function ConfirmDialog(props: ConfirmDialogProps) {
  let confirmBtnRef!: HTMLButtonElement;
  let dialogRef!: HTMLDivElement;

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      props.onCancel();
    } else if (e.key === 'Tab' && dialogRef) {
      const focusables = dialogRef.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        last.focus();
        e.preventDefault();
      } else if (!e.shiftKey && document.activeElement === last) {
        first.focus();
        e.preventDefault();
      }
    }
  };

  createEffect(
    () => props.open ?? props.isOpen ?? false,
    (isOpen) => {
      if (isOpen) {
        window.addEventListener('keydown', handleKeyDown);
        setTimeout(() => confirmBtnRef?.focus(), 50);
      } else {
        window.removeEventListener('keydown', handleKeyDown);
      }
    }
  );

  onCleanup(() => {
    window.removeEventListener('keydown', handleKeyDown);
  });

  const isDanger = () =>
    props.variant === 'danger' ||
    props.isDestructive === true ||
    (props.variant === undefined && props.isDestructive !== false);

  return (
    <Show when={props.open ?? props.isOpen}>
      <Portal>
        <div
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) props.onCancel();
          }}
          role="presentation"
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            class="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-200/80 animate-in fade-in zoom-in-95 duration-150"
          >
            <h2 id="confirm-dialog-title" class="text-lg font-semibold text-slate-900 mb-2">
              {props.title}
            </h2>
            <Show when={props.description}>
              <p class="text-sm text-slate-600 mb-4">{props.description}</p>
            </Show>
            <Show when={props.children}>
              <div class="mb-4">{props.children}</div>
            </Show>
            <div class="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={props.onCancel}
                class="btn btn-secondary"
                disabled={props.isLoading}
              >
                {props.cancelLabel || 'Cancel'}
              </button>
              <button
                ref={confirmBtnRef}
                type="button"
                onClick={props.onConfirm}
                class={isDanger() ? 'btn btn-destructive' : 'btn btn-primary'}
                disabled={props.isLoading}
              >
                {props.isLoading ? 'Please wait…' : props.confirmLabel || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      </Portal>
    </Show>
  );
}
