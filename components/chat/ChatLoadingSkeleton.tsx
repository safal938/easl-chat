'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ChatLoadingSkeletonProps {
  className?: string;
  type?: 'initializing' | 'loading-messages';
}

export function ChatLoadingSkeleton({ className, type = 'initializing' }: ChatLoadingSkeletonProps) {
  return (
    <div className={cn("flex flex-col h-full bg-gradient-to-br from-blue-50 via-white to-blue-100", className)}>
      {/* Header area skeleton */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-8">
        
        {/* Logo/Icon area */}
        <div className="flex flex-col items-center space-y-4">
        
          
         
        </div>

        {/* Loading indicator */}
        <div className="flex flex-col items-center space-y-4">
          {/* Animated dots */}
          <div className="flex space-x-2">
            <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" />
            <div 
              className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" 
              style={{ animationDelay: '0.1s' }}
            />
            <div 
              className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" 
              style={{ animationDelay: '0.2s' }}
            />
          </div>
          
          {/* Loading text */}
          <div className="text-center">
            <p className="text-gray-600 font-medium">
              {type === 'initializing' ? 'Initializing Chat...' : 'Loading Messages...'}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              {type === 'initializing' 
                ? 'Setting up your medical consultation' 
                : 'Retrieving your conversation history'
              }
            </p>
          </div>
        </div>

        {/* Message skeleton preview */}
        {type === 'loading-messages' && (
          <div className="w-full max-w-2xl space-y-4">
            {/* User message skeleton */}
            <div className="flex justify-end">
              <div className="bg-gray-100 rounded-2xl p-4 max-w-xs animate-pulse">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-full" />
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                </div>
              </div>
            </div>
            
            {/* AI message skeleton */}
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-2xl p-4 max-w-md animate-pulse shadow-sm">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-6 h-6 bg-gray-200 rounded-full" />
                  <div className="h-3 bg-gray-200 rounded w-20" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-full" />
                  <div className="h-4 bg-gray-200 rounded w-5/6" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input area skeleton */}
      <div className="p-6 border-t border-gray-200/50">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white border border-gray-200 rounded-2xl p-4 animate-pulse shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="flex-1">
                <div className="h-10 bg-gray-100 rounded-xl" />
              </div>
              <div className="w-10 h-10 bg-gray-200 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}