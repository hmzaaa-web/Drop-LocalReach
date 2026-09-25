import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ScrollToTop } from './components/ScrollToTop';
import { Toast, ToastMessage } from './components/Toast';
import { Home } from './pages/Home/Home';
import { About } from './pages/About/About';
import { HowItWorks } from './pages/HowItWorks/HowItWorks';
import { Upload } from './pages/Upload/Upload';
import { ImageShare } from './pages/ImageShare/ImageShare';
import { Scan } from './pages/Scan/Scan';
import { FileAccess } from './pages/FileAccess/FileAccess';
import { Contact } from './pages/Contact/Contact';
import { Privacy } from './pages/Privacy/Privacy';
import { Terms } from './pages/Terms/Terms';
import { Admin } from './pages/Admin/Admin';


export const App: React.FC = () => {
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showNotification = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({
      id: Date.now().toString(),
      type,
      text,
    });
  };

  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="min-h-screen flex flex-col bg-brand-neutral-50 text-brand-black font-sans selection:bg-brand-green-mint selection:text-brand-black">
        {/* Navigation */}
        <Navbar />

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col justify-start">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/privacy-policy" element={<Navigate to="/privacy" replace />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/terms-and-conditions" element={<Navigate to="/terms" replace />} />
            <Route path="/upload" element={<Upload onNotify={showNotification} />} />
            <Route path="/share-image" element={<ImageShare onNotify={showNotification} />} />
            <Route path="/scan" element={<Scan onNotify={showNotification} />} />
            <Route path="/f/:token" element={<FileAccess onNotify={showNotification} />} />
            <Route path="/admin" element={<Admin onNotify={showNotification} />} />
            <Route path="*" element={<Navigate to="/" replace />} />

          </Routes>
        </main>

        {/* Minimal Footer */}
        <Footer />

        {/* Toast notifications */}
        <Toast toast={toast} onClose={() => setToast(null)} />
      </div>
    </BrowserRouter>
  );
};

export default App;
