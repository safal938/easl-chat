'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';
import { useAuthContext } from '@/components/auth-provider';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const { signUp, logIn, error } = useAuth();
  const { enableGuestMode } = useAuthContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      await logIn(email, password);
    } else {
      await signUp(email, password);
    }
  };

  const handleGuestMode = () => {
    enableGuestMode();
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-6 text-center text-2xl font-bold text-gray-800">
          {isLogin ? 'Welcome Back' : 'Create an Account'}
        </h1>
        {error && <p className="mb-4 text-center text-red-500">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            type="email"
            value={email}
            onChange={(e:any) => setEmail(e.target.value)}
            placeholder="Email"
            required
          />
          <Input
            type="password"
            value={password}
            onChange={(e:any) => setPassword(e.target.value)}
            placeholder="Password"
            required
          />
          <Button type="submit" className="w-full">
            {isLogin ? 'Log In' : 'Sign Up'}
          </Button>
        </form>
        
        {/* Guest Mode Option */}
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500">Or</span>
            </div>
          </div>
          
          <Button
            type="button"
            variant="outline"
            className="w-full mt-4"
            onClick={handleGuestMode}
          >
            Continue as Guest
          </Button>
          
          <p className="mt-3 text-xs text-center text-gray-500">
            Guest mode stores chats locally on your device. Data will be lost if you clear browser data.
          </p>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-blue-600 hover:underline"
          >
            {isLogin ? 'Need an account? Sign up' : 'Have an account? Log in'}
          </button>
        </div>
      </div>
    </div>
  );
}