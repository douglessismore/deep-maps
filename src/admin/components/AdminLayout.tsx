import type { ReactNode } from 'react';
import { AdminSidebar } from './AdminSidebar';

export function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-screen flex bg-[#0a0a0a] text-gray-200">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
