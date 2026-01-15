import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import CitizenPortal from './CitizenPortal';
import { clearRole } from '@/utils/auth';

export default function CitizenDashboard({ onRoleChange }) {
  const handleLogout = () => {
    clearRole();
    if (onRoleChange) {
      onRoleChange();
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-900 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-100">Report Emergency</h1>
              <p className="text-sm text-slate-400">Report emergencies quickly and securely</p>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="border-slate-600 text-slate-300"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Switch Role
            </Button>
          </div>
        </div>
      </div>

      <CitizenPortal />
    </div>
  );
}