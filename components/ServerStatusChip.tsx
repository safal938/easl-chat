import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle } from 'lucide-react';

interface ServerStatusChipProps {
  isServerHealthy: boolean;
  isChecking: boolean;
}

const SERVER_READY_KEY = 'medforce_server_ready_shown';

export const ServerStatusChip: React.FC<ServerStatusChipProps> = ({
  isServerHealthy,
  isChecking,
}) => {
  const [showChip, setShowChip] = useState(false);
  const [serverBecameHealthyAt, setServerBecameHealthyAt] = useState<Date | null>(null);
  const [wasUnhealthy, setWasUnhealthy] = useState(false);

  // Check if we've already shown the server ready state in this session
  const hasShownServerReady = () => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(SERVER_READY_KEY) === 'true';
  };

  const markServerReadyAsShown = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(SERVER_READY_KEY, 'true');
    }
  };

  // Track when server becomes healthy and show/hide chip accordingly
  useEffect(() => {
    // Track if server was unhealthy
    if (!isServerHealthy || isChecking) {
      setWasUnhealthy(true);
    }

    // Always show chip when server is not healthy or checking
    if (!isServerHealthy || isChecking) {
      setShowChip(true);
    } else if (isServerHealthy && !isChecking && wasUnhealthy && !serverBecameHealthyAt) {
      // Server just became healthy - mark the time and show "Server Ready"
      setServerBecameHealthyAt(new Date());
      setShowChip(true);
    }
  }, [isServerHealthy, isChecking, wasUnhealthy, serverBecameHealthyAt]);

  // Hide chip after 3 seconds when server is healthy and mark as shown
  useEffect(() => {
    if (serverBecameHealthyAt && isServerHealthy && !isChecking && showChip) {
      const timer = setTimeout(() => {
        setShowChip(false);
        markServerReadyAsShown();
      }, 3000); // 3 seconds

      return () => {
        clearTimeout(timer);
      };
    }
  }, [serverBecameHealthyAt, isServerHealthy, isChecking, showChip]);

  if (!showChip) return null;

  const getChipContent = () => {
    if (!isServerHealthy || isChecking) {
      return {
        icon: <Loader2 className="w-3 h-3 animate-spin" />,
        text: "Starting The Server",
        bgColor: "bg-blue-300",
        textColor: "text-white",
        borderColor: "border-blue-200"
      };
    } else {
      return {
        icon: <CheckCircle className="w-3 h-3" />,
        text: "Server Ready",
        bgColor: "bg-green-100",
        textColor: "text-green-800",
        borderColor: "border-green-200"
      };
    }
  };

  const { icon, text, bgColor, textColor, borderColor } = getChipContent();

  return (
    <div className="flex justify-center mb-2">
      <div className={`inline-flex items-start gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${bgColor} ${textColor} ${borderColor} transition-all duration-300`}>
        {icon}
        <span>{text}</span>
      </div>
    </div>
  );
};