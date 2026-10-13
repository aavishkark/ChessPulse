import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import RecruiterSandboxModal from '../Sandbox/RecruiterSandboxModal';

export default function AppShell({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sandboxOpen, setSandboxOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0B0F19] text-gray-900 dark:text-gray-100 flex flex-col font-sans transition-colors">
      {/* Vertical Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpenSandbox={() => setSandboxOpen(true)}
      />

      {/* Main Content Area */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Sticky Header */}
        <Header
          onToggleSidebar={() => setSidebarOpen(prev => !prev)}
          onOpenSandbox={() => setSandboxOpen(true)}
        />

        {/* Dynamic Route Viewport */}
        <main className="flex-1 p-4 lg:p-6 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* 1-Click Recruiter Sandbox & Pipeline Stepper Modal */}
      <RecruiterSandboxModal
        isOpen={sandboxOpen}
        onClose={() => setSandboxOpen(false)}
      />
    </div>
  );
}
