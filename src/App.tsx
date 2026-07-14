import React from 'react';
import { LanguageProvider } from './lib/translations';
import MainLayout from './components/MainLayout';

export default function App() {
  return (
    <LanguageProvider>
      <div id="app-root" className="min-h-screen bg-slate-950 font-sans text-slate-100 antialiased selection:bg-indigo-500/20 selection:text-indigo-200">
        <MainLayout />
      </div>
    </LanguageProvider>
  );
}
