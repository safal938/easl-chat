'use client';
import Sidebar from '@/components/Sidebar';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AuthProvider } from '@/components/auth-provider';

// Import test helpers to make them available in browser console
if (typeof window !== 'undefined') {
  import('@/utils/canvas-test-helpers');
}

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const isLoginPage = pathname === '/login';

  const handleSelectChat = (chatId: string | null) => {
    if (chatId) {
      router.push(`/chat/${chatId}`);
    } else {
      // Use replace instead of push to avoid history issues
      router.replace('/');
    }
  };

  const handlePrepareNewChat = () => {
    // Use replace to ensure clean navigation
    router.replace('/');
  };

  return (
    <AuthProvider>
      <div className="flex h-screen bg-gray-100">
        {!isLoginPage && (
          <Sidebar
            onSelectChat={handleSelectChat}
            onPrepareNewChat={handlePrepareNewChat}
            isCollapsed={isSidebarCollapsed}
            setIsCollapsed={setIsSidebarCollapsed}
          />
        )}
        <main className="flex-1 flex flex-col">
          {children}
        </main>
      </div>
    </AuthProvider>
  );
}