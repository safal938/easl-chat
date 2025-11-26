'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { PlusSquare, MessageSquare, LogOut, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { useAuthContext } from '@/components/auth-provider';
import { signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { UnifiedChatService } from '@/services/unifiedChatService';
import { LocalStorageChatService } from '@/services/localStorageChatService';

interface SidebarProps {
  onSelectChat: (chatId: string | null) => void;
  onPrepareNewChat: () => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export default function Sidebar({ 
  onSelectChat, 
  onPrepareNewChat,
  isCollapsed,
  setIsCollapsed
}: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { isGuestMode } = useAuthContext();
  const [chatsSnapshot, setChatsSnapshot] = useState<any>(null);
  const [localChats, setLocalChats] = useState<any[]>([]);
  const [chatsWithMessages, setChatsWithMessages] = useState<Set<string>>(new Set());

  // Determine active chat from pathname
  const activeChatId = pathname.startsWith('/chat/') 
    ? pathname.split('/')[2] 
    : null;

  // Check if we're on the new chat page
  const isNewChatActive = pathname === '/';

  // Load chats based on mode
  useEffect(() => {
    const userId: string | null = isGuestMode ? null : (user?.uid || null);
    
    // Need either authenticated user or guest mode
    if (!userId && !isGuestMode) return;

    // Guest mode: Load from localStorage
    if (isGuestMode) {
      const loadLocalChats = async () => {
        try {
          const chats = await LocalStorageChatService.getAllChatsMetadata(userId);
          setLocalChats(chats);
          
          // Check which chats have messages
          const chatsWithMessagesSet = new Set<string>();
          await Promise.all(
            chats.map(async (chat) => {
              try {
                const hasMessages = await UnifiedChatService.chatHasMessages(userId, chat.id);
                if (hasMessages) {
                  chatsWithMessagesSet.add(chat.id);
                }
              } catch (error) {
                console.error(`Error checking messages for chat ${chat.id}:`, error);
              }
            })
          );
          setChatsWithMessages(chatsWithMessagesSet);
        } catch (error) {
          console.error('Error loading chats from localStorage:', error);
        }
      };
      
      loadLocalChats();
      
      // Poll for changes every 2 seconds (since localStorage doesn't have listeners)
      const interval = setInterval(loadLocalChats, 2000);
      return () => clearInterval(interval);
    }

    // Authenticated mode: Use Firebase listener
    const chatsQuery = query(
      collection(db, `users/${userId}/chats`),
      orderBy('updatedAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(chatsQuery, async (snapshot) => {
      setChatsSnapshot(snapshot);
      
      // Check which chats have messages
      const chatIds = snapshot.docs.map(doc => doc.id);
      const chatsWithMessagesSet = new Set<string>();
      
      // Check each chat for messages
      await Promise.all(
        chatIds.map(async (chatId) => {
          try {
            const hasMessages = await UnifiedChatService.chatHasMessages(userId, chatId);
            if (hasMessages) {
              chatsWithMessagesSet.add(chatId);
            }
          } catch (error) {
            console.error(`Error checking messages for chat ${chatId}:`, error);
          }
        })
      );
      
      setChatsWithMessages(chatsWithMessagesSet);
    });

    return () => unsubscribe();
  }, [user?.uid, isGuestMode]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleSelectChat = (chatId: string) => {
    // Don't re-select if already active
    if (chatId !== activeChatId) {
      onSelectChat(chatId);
    }
  };

  const handleNewChat = () => {
    // Only navigate if not already on new chat page
    if (!isNewChatActive) {
      onPrepareNewChat();
    }
  };

  return (
    <div
      className={cn(
        'bg-white border-r border-gray-200 p-4 flex flex-col transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-56'
      )}
    >
      <div className="flex items-center justify-between mb-4">
        {!isCollapsed && <h1 className="text-md font-bold text-gray-900">Expert guideline system</h1>}
        <Button
          onClick={() => setIsCollapsed(!isCollapsed)}
          variant="ghost"
          className="hover:bg-gray-100 p-2"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronsRight className="text-gray-600" /> : <ChevronsLeft className="text-gray-600" />}
        </Button>
      </div>

      <Button
        onClick={handleNewChat}
        variant="ghost"
        className={cn(
          'w-full justify-start text-sm mb-4 hover:bg-gray-100 text-gray-700 py-2',
          isCollapsed && 'justify-center',
          isNewChatActive && 'bg-blue-50 font-semibold text-blue-600 hover:bg-blue-100'
        )}
        disabled={isNewChatActive}
      >
        <PlusSquare className={cn(!isCollapsed && 'mr-2', 'h-4 w-4')} />
        {!isCollapsed && 'New Chat'}
      </Button>

      <nav className="flex-1 space-y-2 overflow-y-auto">
        {!isCollapsed && (
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 mb-2">
            Recent Chats
          </h2>
        )}
        
        {/* Render chats based on mode */}
        {isGuestMode ? (
          // Guest mode: Render from localChats
          localChats
            .filter((chat) => chatsWithMessages.has(chat.id))
            .map((chat) => {
              const isActive = activeChatId === chat.id;
              const chatTitle = chat.title || 'New Chat';
              
              return (
                <button
                  key={chat.id}
                  onClick={() => handleSelectChat(chat.id)}
                  className={cn(
                    'flex items-center p-2 rounded-md cursor-pointer text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors text-sm w-full',
                    isActive && 'bg-blue-50 font-semibold text-blue-600 hover:bg-blue-100',
                    isCollapsed && 'justify-center'
                  )}
                  title={chatTitle}
                  disabled={isActive}
                >
                  <MessageSquare className={cn(!isCollapsed && 'mr-2', 'h-4 w-4 flex-shrink-0')} />
                  {!isCollapsed && (
                    <span className="truncate text-left">{chatTitle}</span>
                  )}
                </button>
              );
            })
        ) : (
          // Authenticated mode: Render from chatsSnapshot
          chatsSnapshot?.docs
            .filter((doc: any) => chatsWithMessages.has(doc.id))
            .map((doc: any) => {
              const isActive = activeChatId === doc.id;
              const chatTitle = doc.data().title || 'New Chat';
              
              return (
                <button
                  key={doc.id}
                  onClick={() => handleSelectChat(doc.id)}
                  className={cn(
                    'flex items-center p-2 rounded-md cursor-pointer text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors text-sm w-full',
                    isActive && 'bg-blue-50 font-semibold text-blue-600 hover:bg-blue-100',
                    isCollapsed && 'justify-center'
                  )}
                  title={chatTitle}
                  disabled={isActive}
                >
                  <MessageSquare className={cn(!isCollapsed && 'mr-2', 'h-4 w-4 flex-shrink-0')} />
                  {!isCollapsed && (
                    <span className="truncate flex-1 text-left">
                      {chatTitle}
                    </span>
                  )}
                </button>
              );
            })
        )}

        {/* Show "No chats yet" message */}
        {((isGuestMode && localChats.filter(c => chatsWithMessages.has(c.id)).length === 0) ||
          (!isGuestMode && (!chatsSnapshot?.docs.length || chatsSnapshot?.docs.filter((doc: any) => chatsWithMessages.has(doc.id)).length === 0))) && 
          !isCollapsed && (
          <p className="text-xs text-gray-400 text-center py-4">
            No chats yet
          </p>
        )}
      </nav>

      {user && (
        <div className="mt-auto border-t border-gray-200 pt-3">
          <div className={cn('flex items-center gap-2 mb-3', isCollapsed && 'justify-center')}>
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-gray-200 text-gray-700 font-semibold">
                {user.email?.[0].toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <div className="flex-1 truncate">
                <p className="text-xs font-medium text-gray-800 truncate">{user.email}</p>
              </div>
            )}
          </div>
          
          <Button
            onClick={handleSignOut}
            variant="ghost"
            className={cn(
              'w-full justify-start hover:bg-gray-100 text-gray-700 text-sm py-2',
              isCollapsed && 'justify-center'
            )}
          >
            <LogOut className={cn(!isCollapsed && 'mr-2', 'h-4 w-4')} />
            {!isCollapsed && 'Sign Out'}
          </Button>
        </div>
      )}
    </div>
  );
}