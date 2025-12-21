import React, { useState, useEffect } from 'react';
import ChatInterface from './components/ChatInterface';
import ReportView from './components/ReportView';
import OnboardingFlow from './components/OnboardingFlow';
import AdminDashboard from './components/AdminDashboard';
import ContactForm from './components/ContactForm';

function App() {
  const [report, setReport] = useState(null);
  const [onboardingData, setOnboardingData] = useState(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [contactSubmitted, setContactSubmitted] = useState(false);

  // Simple URL check for admin mode
  useEffect(() => {
    if (window.location.pathname === '/admin') {
      setShowAdmin(true);
    }
  }, []);

  const handleOnboardingComplete = (data) => {
    setOnboardingData(data);
  };

  const handleChatComplete = (generatedReport, id) => {
    setReport(generatedReport);
    setSessionId(id);
  };

  const handleContactSubmit = async (contactData) => {
    try {
      await fetch('http://localhost:3000/api/submit-contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, contact: contactData })
      });
      setContactSubmitted(true);
    } catch (e) {
      console.error(e);
      alert("Error submitting contact details. Please try again.");
    }
  };

  if (showAdmin) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center py-10">
        <div className="w-full max-w-6xl flex justify-between items-center mb-8 px-4">
          <header>
            <h1 className="text-3xl font-extrabold text-red-600 tracking-tight">Rectangle Red Admin</h1>
          </header>
          <button onClick={() => window.location.href = '/'} className="text-gray-500 underline">Exit Admin</button>
        </div>
        <AdminDashboard />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-10">
      <header className="mb-8 text-center relative w-full max-w-2xl flex flex-col items-center">
        <img src="/logo.png" alt="Rectangle Red Logo" className="h-20 mb-4" />
        <p className="text-gray-500 mt-2">Software Scoping Portal powered by Daniel AI</p>
      </header>

      <main className="w-full flex justify-center px-4">
        {!onboardingData ? (
          <OnboardingFlow onComplete={handleOnboardingComplete} />
        ) : !report ? (
          <ChatInterface
            onboardingData={onboardingData}
            onComplete={handleChatComplete}
          />
        ) : !contactSubmitted ? (
          <ContactForm onSubmit={handleContactSubmit} />
        ) : (
          <div className="flex flex-col items-center w-full max-w-2xl bg-white p-10 rounded-lg shadow-xl text-center">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Thank You!</h2>
            <p className="text-gray-600 mb-8 text-lg">
              Your project scope has been successfully generated. One of our experts will review it and contact you shortly at the email provided.
            </p>
            <button
              onClick={() => {
                setReport(null);
                setOnboardingData(null);
                setSessionId(null);
                setContactSubmitted(false);
              }}
              className="mt-4 text-red-600 hover:text-red-800 underline font-medium"
            >
              Start New Project
            </button>
          </div>
        )}
      </main>

      <footer className="mt-12 text-sm text-gray-400">
        &copy; {new Date().getFullYear()} Rectangle Red. Powered by Daniel AI.
      </footer>
    </div>
  );
}

export default App;
