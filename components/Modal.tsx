
import React, { useEffect, useRef } from 'react';
import { CloseIcon } from './Icons';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Save the element that triggered the modal opening
    if (isOpen) {
      triggerElementRef.current = document.activeElement as HTMLElement;
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
      // Return focus to the trigger element after closing
      if (triggerElementRef.current) {
        triggerElementRef.current.focus();
        triggerElementRef.current = null;
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const dialogElement = dialogRef.current;
    if (!dialogElement) return;

    // Handle backdrop click
    const handleBackdropClick = (event: MouseEvent) => {
      if (event.target === dialogElement) {
        onClose();
      }
    };

    // Handle Escape key (dialog native behavior usually covers this, but explicit handling for custom animations)
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault(); // Prevent default dialog close to allow custom animation
        onClose();
      }
    };

    dialogElement.addEventListener('click', handleBackdropClick);
    dialogElement.addEventListener('keydown', handleKeyDown);

    return () => {
      dialogElement.removeEventListener('click', handleBackdropClick);
      dialogElement.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);
  
  // No need for `if (!isOpen) return null;` here, as `dialog` element controls its visibility

  return (
    <dialog
      ref={dialogRef}
      className={`relative p-0 rounded-xl shadow-2xl w-full max-w-lg ${isOpen ? 'modal-open' : 'modal-closed'}`}
      onClose={onClose} // Native dialog `onClose` is called when `dialog.close()` is invoked
      aria-modal="true"
      aria-labelledby="modal-title"
      style={{
        zIndex: 50, // Ensure it's above other content
        background: 'transparent', // Make dialog itself transparent to allow custom background
      }}
    >
      {/* Backdrop for animation */}
      <div 
        className={`fixed inset-0 bg-black bg-opacity-60 dark:bg-opacity-70 backdrop-blur-sm flex justify-center items-center p-4 modal-backdrop`}
      >
        <div 
          className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg modal-content"
          onClick={e => e.stopPropagation()}
        >
          <header className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
            <h2 id="modal-title" className="text-lg font-bold text-slate-800 dark:text-slate-100">{title}</h2>
            <button 
              onClick={onClose} 
              className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
              aria-label="بستن دیالوگ"
            >
              <CloseIcon className="w-6 h-6" />
            </button>
          </header>
          <main className="p-6 max-h-[70vh] overflow-y-auto"> {/* Added max-height and overflow for scrollability */}
            {children}
          </main>
        </div>
      </div>
       <style>{`
        dialog {
          border: none;
          padding: 0;
          margin: 0;
          opacity: 0; /* Hidden by default, controlled by JS class */
          pointer-events: none; /* Block interactions until open */
        }
        dialog.modal-open {
          opacity: 1;
          pointer-events: auto;
        }
        dialog::backdrop {
          background-color: transparent; /* Managed by the internal div */
          opacity: 0;
          transition: opacity 0.3s ease-out;
        }
        dialog.modal-open::backdrop {
          opacity: 1;
          background-color: rgba(0, 0, 0, 0.6); /* Ensure backdrop color */
        }

        /* Backdrop animation */
        .modal-backdrop {
            opacity: 0;
            transition: opacity 0.3s ease-out;
        }
        dialog.modal-open .modal-backdrop {
            opacity: 1;
        }
        /* Content animation: Slide up and fade in */
        .modal-content {
            opacity: 0;
            transform: translateY(2rem) scale(0.98);
            transition: opacity 0.3s ease-out, transform 0.3s ease-out;
        }
        dialog.modal-open .modal-content {
            opacity: 1;
            transform: translateY(0) scale(1);
        }

        /* Fix for dialog closing animation when clicking outside / escape key */
        dialog[open].modal-closed {
            opacity: 0;
            pointer-events: none;
        }
        dialog[open].modal-closed .modal-backdrop {
            opacity: 0;
        }
        dialog[open].modal-closed .modal-content {
            opacity: 0;
            transform: translateY(2rem) scale(0.98);
        }
      `}</style>
    </dialog>
  );
};

export default Modal;