import React from 'react';
import { supabase } from '../supabaseClient';

function Auth() {
  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google' });
  };

  return (
    <div className="min-h-screen w-full animated-gradient-bg flex flex-col">
      {/* Navbar */}
      <nav className="w-full py-4 px-6 md:px-12 flex items-center justify-between bg-black/30 backdrop-blur-md shadow-sm">
        <span className="flex items-center gap-2">
          <img src="/check.png" alt="Logo" className="w-7 h-7 md:w-8 md:h-8" />
          <span className="text-xl md:text-2xl font-bold text-white tracking-tight">Task Management App</span>
        </span>
      </nav>
      {/* Centered Card */}
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl p-8 gradient-border border border-transparent animate-fade-in">
          <h2 className="text-2xl font-bold mb-8 text-center text-black">Sign In</h2>
          <button
            onClick={signInWithGoogle}
            className="flex items-center gap-3 px-5 py-2 bg-white/80 border border-gray-300 rounded-full shadow-sm hover:bg-gray-100 transition text-black font-medium w-full justify-center focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <img src="/search.png" alt="Google" className="w-5 h-5" />
            <span className="text-base md:text-sm">Sign in with Google</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Auth; 