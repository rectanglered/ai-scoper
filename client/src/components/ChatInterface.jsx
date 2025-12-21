import React, { useState, useEffect, useRef } from 'react';
import LoadingAnimation from './LoadingAnimation';

const ChatInterface = ({ onboardingData, onComplete }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [sessionId, setSessionId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const bottomRef = useRef(null);

    const initializedRef = useRef(false);

    useEffect(() => {
        // Scroll to bottom
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Start session immediately when component mounts using the onboarding data
    useEffect(() => {
        if (onboardingData && !sessionId && !initializedRef.current) {
            initializedRef.current = true;
            startSession(onboardingData);
        }
    }, [onboardingData, sessionId]);

    const startSession = async (data) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/start-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data) // Pass the full structured object
            });
            if (!response.ok) throw new Error('Failed to start session');
            const resData = await response.json();
            setSessionId(resData.sessionId);

            // Initial context message construction for display
            const contextMsg = `
        **Project**: ${resData.projectName || data.projectName || 'Untitled'}
        **Description**: ${data.description.substring(0, 100)}...
        **Platform**: ${data.platforms.join(', ')}
        **Users**: ${data.targetUsers.join(', ')}
        **Budget**: ${data.budget || 'Not specified'}
        **Features**: ${data.selectedFeatures ? data.selectedFeatures.join(', ') : 'None selected'}
      `;

            setMessages([
                { role: 'user', content: "I've provided the initial project details." }, // Simplified user msg
                { role: 'model', content: resData.question }
            ]);
        } catch (err) {
            console.error(err);
            setError("Connection failed. Please check if the server is running on the same port.");
            setMessages(prev => [...prev, { role: 'error', content: 'Connection failed. Is the server running?' }]);
        }
        setLoading(false);
    };

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = input;
        setInput('');
        setError(null);

        // Safety check - though we should always have a session by now
        if (!sessionId) return;

        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setLoading(true);

        try {
            const response = await fetch('/api/answer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId, answer: userMsg })
            });
            if (!response.ok) throw new Error('Failed to get answer');
            const data = await response.json();

            if (data.completed) {
                onComplete(data.report, sessionId);
            } else {
                setMessages(prev => [...prev, { role: 'model', content: data.question }]);
            }
        } catch (err) {
            console.error(err);
            setError("Failed to send message. Server might be unreachable.");
            setMessages(prev => [...prev, { role: 'error', content: 'Failed to send message.' }]);
        }
        setLoading(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex flex-col h-[600px] w-full max-w-2xl bg-white shadow-xl rounded-lg overflow-hidden border border-gray-200">
            <div className="bg-white p-6 border-b border-gray-100 flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Project Scoping</h2>
                    <p className="text-xs text-gray-500">Powered by Daniel AI</p>
                </div>
                <div className="flex items-center space-x-2 bg-red-50 px-3 py-1 rounded-full border border-red-100">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                    <span className="text-xs font-medium text-red-700">Live Session</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-sm">
                        <p className="font-bold">Connection Error</p>
                        <p className="text-sm">{error}</p>
                    </div>
                )}
                {messages.length === 0 && (
                    <div className="text-center text-gray-500 mt-10">
                        <p className="text-lg font-medium">Hello! I'm Daniel.</p>
                        <p>Tell me about your software project idea to get started.</p>
                    </div>
                )}

                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} ${msg.role === 'model' ? 'space-x-2' : ''}`}>
                        {msg.role === 'model' && (
                            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 mt-1 shadow-sm border border-red-100 bg-white">
                                <img src="/daniel_avatar.png" alt="Daniel AI" className="w-full h-full object-cover" />
                            </div>
                        )}
                        <div
                            className={`max-w-[80%] rounded-lg p-3 text-sm ${msg.role === 'user'
                                ? 'bg-red-600 text-white rounded-br-none shadow-md'
                                : msg.role === 'error'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
                                }`}>
                            {msg.content}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 mt-1 shadow-sm border border-red-100 bg-white">
                            <img src="/daniel_avatar.png" alt="Daniel AI" className="w-full h-full object-cover" />
                        </div>
                        <LoadingAnimation
                            text={messages.filter(m => m.role === 'user').length >= 5 ? "Drafting your comprehensive report..." : "Daniel is thinking"}
                        />
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            <div className="p-4 bg-white border-t border-gray-100">
                <div className="flex space-x-2">
                    <input
                        type="text"
                        className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 placeholder:text-gray-400 placeholder:font-light placeholder:italic"
                        placeholder={sessionId ? "Type your answer..." : "Briefly describe your project..."}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={loading}
                    />
                    <button
                        onClick={handleSend}
                        disabled={loading || !input.trim()}
                        className="bg-red-600 text-white rounded-full p-2 w-10 h-10 flex items-center justify-center hover:bg-red-700 disabled:opacity-50 transition-colors"
                    >
                        ➤
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatInterface;
