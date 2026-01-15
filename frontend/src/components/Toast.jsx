import { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Toast({ message, type = 'info', onClose, duration = 5000 }) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const bgColor = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    warning: 'bg-yellow-600',
    info: 'bg-blue-600',
  }[type] || 'bg-blue-600';

  return (
    <div className={`${bgColor} text-white px-4 py-3 rounded-lg shadow-lg flex items-center justify-between gap-4 min-w-[300px] max-w-md`}>
      <span className="flex-1">{message}</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={onClose}
        className="text-white hover:bg-black/20 h-6 w-6 p-0"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
          duration={toast.duration}
        />
      ))}
    </div>
  );
}