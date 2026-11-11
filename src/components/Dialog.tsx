import { Portal, type JSX } from '@solidjs/web';
import { createEffect, onCleanup, Show } from 'solid-js';
import { Icon } from './Icon';

export interface DialogProps {
  open: boolean;
  title: string;
  titleId?: string;
  maxWidth?: string;
  onClose: () => void;
  children: JSX.Element;
}

export function Dialog(props: DialogProps) {
  let dialogRef!: HTMLDivElement;
  let triggerEl: HTMLElement | null = null;

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      e.preventDefault();
      props.onClose();
    } else if (e.key === 'Tab' && dialogRef) {
      const focusables = dialogRef.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (!dialogRef.contains(document.activeElement)) {
        first.focus();
        e.preventDefault();
      } else if (e.shiftKey && document.activeElement === first) {
        last.focus();
        e.preventDefault();
      } else if (!e.shiftKey && document.activeElement === last) {
        first.focus();
        e.preventDefault();
      }
    }
  };

  createEffect(
    () => props.open,
    (isOpen) => {
      if (isOpen) {
        triggerEl = document.activeElement as HTMLElement | null;
        window.addEventListener('keydown', handleKeyDown);
        setTimeout(() => {
          if (!dialogRef) return;
          const firstFocusable = dialogRef.querySelector<HTMLElement>(
            'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled])'
          );
          firstFocusable?.focus();
        }, 50);
      } else {
        window.removeEventListener('keydown', handleKeyDown);
        if (triggerEl && typeof triggerEl.focus === 'function') {
          triggerEl.focus();
          triggerEl = null;
        }
      }
    }
  );

  onCleanup(() => {
    window.removeEventListener('keydown', handleKeyDown);
    if (triggerEl && typeof triggerEl.focus === 'function') {
      triggerEl.focus();
      triggerEl = null;
    }
  });

  const titleId = () => props.titleId || 'accessible-dialog-title';

  return (
    <Show when={props.open}>
      <Portal>
        <div
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) props.onClose();
          }}
          role="presentation"
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId()}
            class={`relative w-full ${props.maxWidth || 'max-w-md'} bg-white rounded-2xl p-6 shadow-2xl border border-slate-200/80 z-10 space-y-4 animate-in fade-in zoom-in-95 duration-150`}
          >
            <div class="flex items-center justify-between">
              <h2 id={titleId()} class="font-semibold text-slate-900 text-lg">
                {props.title}
              </h2>
              <button
                type="button"
                onClick={() => props.onClose()}
                class="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                aria-label="Close dialog"
              >
                <Icon name="x" size={18} />
              </button>
            </div>

            {props.children}
          </div>
        </div>
      </Portal>
    </Show>
  );
}
