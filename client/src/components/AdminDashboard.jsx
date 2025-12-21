import React, { useState, useEffect } from 'react';
import ReportView from './ReportView';

const AdminDashboard = () => {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSession, setSelectedSession] = useState(null);

    useEffect(() => {
        fetchSessions();
    }, []);

    const fetchSessions = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/sessions');
            const data = await res.json();
            setSessions(data);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;

    if (selectedSession) {
        return (
            <div className="w-full max-w-4xl p-4">
                <button
                    onClick={() => setSelectedSession(null)}
                    className="mb-4 text-red-600 hover:underline"
                >
                    ← Back to Dashboard
                </button>
                <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
                    <h2 className="text-2xl font-bold mb-2">{selectedSession.projectName}</h2>
                    <p className="text-gray-600 mb-4">{selectedSession.description}</p>
                    <div className="flex flex-col md:flex-row gap-6 mb-6 border-b pb-6">
                        <div className="flex-1">
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Project Info</h3>
                            <div className="grid grid-cols-2 gap-y-1 text-sm">
                                <span className="text-gray-600">Created:</span>
                                <span className="font-medium">{new Date(selectedSession.createdAt).toLocaleString()}</span>
                                <span className="text-gray-600">Budget:</span>
                                <span className="font-medium text-green-700">{selectedSession.budget || 'Not specified'}</span>
                            </div>
                        </div>

                        <div className="flex-1 border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-6 border-gray-100">
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Contact Details</h3>
                            {selectedSession.contactName ? (
                                <div className="text-sm space-y-1">
                                    <div className="font-bold text-lg text-gray-800">{selectedSession.contactName}</div>
                                    <div className="text-gray-600">{selectedSession.contactJobTitle} at {selectedSession.contactCompany}</div>
                                    <div className="flex items-center text-blue-600 mt-1">
                                        <span className="mr-2">✉️</span>
                                        <a href={`mailto:${selectedSession.contactEmail}`} className="hover:underline">{selectedSession.contactEmail}</a>
                                    </div>
                                    <div className="flex items-center text-gray-600">
                                        <span className="mr-2">📞</span> {selectedSession.contactPhone}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-sm text-gray-400 italic">No contact details submitted yet.</div>
                            )}
                        </div>
                    </div>

                    <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-2">Scope Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <h4 className="font-medium text-gray-700 text-sm">Platforms</h4>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {selectedSession.platforms?.map(p => (
                                        <span key={p} className="bg-red-50 text-red-700 px-2 py-1 rounded text-xs border border-red-100">{p}</span>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-700 text-sm">Target Users</h4>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {selectedSession.targetUsers?.map(u => (
                                        <span key={u} className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs border border-blue-100">{u}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="mt-4">
                            <h4 className="font-medium text-gray-700 text-sm">Selected Features</h4>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {selectedSession.selectedFeatures?.map(f => (
                                    <span key={f} className="bg-green-50 text-green-700 px-2 py-1 rounded text-xs border border-green-100">{f}</span>
                                ))}
                                {(!selectedSession.selectedFeatures || selectedSession.selectedFeatures.length === 0) && (
                                    <span className="text-gray-400 text-sm italic">None selected</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="mb-6 border-t pt-4">
                        <h3 className="text-lg font-semibold mb-4">Chat History</h3>
                        <div className="space-y-4 bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                            {selectedSession.history?.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] rounded-lg p-3 text-sm ${msg.role === 'user'
                                        ? 'bg-red-100 text-red-900 rounded-br-none'
                                        : 'bg-white border text-gray-800 rounded-bl-none shadow-sm'
                                        }`}>
                                        <span className="block text-xs font-bold text-gray-400 mb-1 uppercase">{msg.role}</span>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {selectedSession.report ? (
                        <div className="border-t pt-4">
                            <h3 className="text-lg font-semibold mb-4">Generated Report</h3>
                            <ReportView report={selectedSession.report} />
                        </div>
                    ) : (
                        <div className="p-4 bg-yellow-50 text-yellow-800 rounded border border-yellow-200 mt-4">
                            Report not yet generated (Session incomplete).
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-6xl p-4">
            <h2 className="text-3xl font-bold mb-6 text-gray-800">Admin Dashboard</h2>
            <div className="bg-white shadow-xl rounded-lg overflow-hidden border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {sessions.map(session => (
                            <tr key={session.sessionId} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{session.projectName || 'Untitled'}</div>
                                    <div className="text-sm text-gray-500 truncate max-w-xs">{session.description}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {session.clientName}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(session.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {session.report ? (
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                            Completed
                                        </span>
                                    ) : (
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                            In Progress
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <button
                                        onClick={() => setSelectedSession(session)}
                                        className="text-red-600 hover:text-red-900"
                                    >
                                        View
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminDashboard;
