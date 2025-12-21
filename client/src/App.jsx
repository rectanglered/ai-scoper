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
  const [messageSent, setMessageSent] = useState(false);
  const [serverStatus, setServerStatus] = useState('checking'); // checking, online, offline

  useEffect(() => {
    // Admin check
    if (window.location.pathname === '/admin') {
      setShowAdmin(true);
    }

    // Health check
    const checkHealth = async () => {
      try {
        const res = await fetch('/api/health');
        if (res.ok) setServerStatus('online');
        else setServerStatus('offline');
      } catch (e) {
        setServerStatus('offline');
      }
    };

    checkHealth();
    // Poll every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
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
      await fetch('/api/submit-contact', {
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
            <img src="/logo.png" alt="Rectangle Red" className="h-10" />
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
            <div className="flex items-center space-x-4 mb-6 bg-red-50 p-4 rounded-lg border border-red-100 text-left w-full">
              <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-white shadow-sm">
                <img src="/daniel_avatar.png" alt="Daniel" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="text-gray-900 font-medium">I've generated your report.</p>
                <p className="text-sm text-gray-600">One of our technical consultants will review it and send it to you shortly.</p>
              </div>
            </div>

            <p className="text-gray-500 mb-8 italic">
              This usually takes up to 1 business day.
            </p>

            <div className="w-full border-t pt-8 text-left">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Have more questions?</h3>
              <p className="text-sm text-gray-600 mb-4">
                If you have more things you want to add or ask, let me know below.
              </p>

              {messageSent ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center text-green-700">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  <span>Message sent successfully. We'll be in touch!</span>
                </div>
              ) : (
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  const message = formData.get('message');

                  fetch('/api/submit-message', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sessionId, message })
                  })
                    .then(() => setMessageSent(true))
                    .catch(err => alert('Failed to send message.'));
                }}>
                  <textarea
                    name="message"
                    required
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-500 outline-none h-24 placeholder:text-gray-400 placeholder:font-light placeholder:italic"
                    placeholder="Type your message here..."
                  />
                  <button type="submit" className="mt-2 bg-red-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors shadow-sm">
                    Send Message
                  </button>
                </form>
              )}
            </div>

            <button
              onClick={() => {
                setReport(null);
                setOnboardingData(null);
                setSessionId(null);
                setContactSubmitted(false);
              }}
              className="mt-8 text-red-600 hover:text-red-800 underline font-medium"
            >
              Start New Project
            </button>
          </div >
        )
        }
      </main >

      <footer className="mt-12 text-sm text-gray-400">
        &copy; {new Date().getFullYear()} Rectangle Red. Powered by Daniel AI.
        <span className="ml-4 inline-flex items-center space-x-2" title={serverStatus === 'online' ? "Server Online" : "Server Offline"}>
          <span className={`block w-2 h-2 rounded-full ${serverStatus === 'online' ? 'bg-green-500' : serverStatus === 'checking' ? 'bg-yellow-500' : 'bg-red-500'}`}></span>
          <span className="text-xs text-gray-400 capitalize">{serverStatus}</span>
        </span>
      </footer>
    </div >
  );
}

export default App;
