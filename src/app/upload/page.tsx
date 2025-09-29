'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChange, signOutUser } from '@/lib/authService';
import LoginForm from '@/app/components/LoginForm';
import ImageUpload from '@/app/components/ImageUpload';
import ImageList from '@/app/components/ImageList';
import ConsoleLogDisplay from '@/app/components/ConsoleLogDisplay';
import { User } from 'firebase/auth';

export default function UploadPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLoginSuccess = () => {
    setError(null);
    setSuccess('Successfully logged in!');
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleLoginError = (error: string) => {
    setError(error);
    setSuccess(null);
  };

  const handleUploadSuccess = () => {
    setError(null);
    setSuccess('Image uploaded successfully!');
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleUploadError = (error: string) => {
    setError(error);
    setSuccess(null);
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
      setSuccess('Successfully signed out!');
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError('Failed to sign out');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#d9d9d9] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#17663D]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#d9d9d9]">
      {/* Header */}
      <header className="bg-[#17663D] text-white p-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Chicago Oracle - Upload</h1>
          {user && (
            <div className="flex items-center gap-4">
              <span className="text-sm">Welcome, {user.email}</span>
              <button
                onClick={handleSignOut}
                className="px-3 py-1 bg-white text-[#17663D] rounded hover:bg-gray-100 text-sm"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-4">
        {/* Status Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            {success}
          </div>
        )}

        {/* Content based on authentication status */}
        {!user ? (
          <div className="max-w-md mx-auto">
            <LoginForm
              onLoginSuccess={handleLoginSuccess}
              onLoginError={handleLoginError}
            />
          </div>
        ) : (
          <div className="space-y-8">
            <div className="max-w-2xl mx-auto">
              <ImageUpload
                onUploadSuccess={handleUploadSuccess}
                onUploadError={handleUploadError}
              />
            </div>
            
            {/* Image List */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <ImageList onUpdate={handleUploadSuccess} />
            </div>
            
            {/* Console Logs Display */}
            <ConsoleLogDisplay />
          </div>
        )}
      </main>
    </div>
  );
}
