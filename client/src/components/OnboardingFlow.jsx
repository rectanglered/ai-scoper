import React, { useState } from 'react';
import LoadingAnimation from './LoadingAnimation';

const OnboardingFlow = ({ onComplete }) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState({
        projectName: '',
        description: '',
        platforms: [],
        targetUsers: [],
        budget: '',
        selectedFeatures: []
    });
    const [suggestedFeatures, setSuggestedFeatures] = useState([]);

    const updateData = (field, value) => {
        setData(prev => ({ ...prev, [field]: value }));
    };

    const toggleSelection = (field, value) => {
        setData(prev => {
            const current = prev[field];
            if (current.includes(value)) {
                return { ...prev, [field]: current.filter(item => item !== value) };
            } else {
                return { ...prev, [field]: [...current, value] };
            }
        });
    };

    const fetchFeatures = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:3000/api/suggest-features', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    description: data.description,
                    platforms: data.platforms,
                    targetUsers: data.targetUsers
                })
            });
            const result = await res.json();
            const features = result.features || [];
            setSuggestedFeatures(features);
            // Default select all suggested features
            setData(prev => ({ ...prev, selectedFeatures: features }));
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    const suggestName = async () => {
        if (data.description.length < 50) {
            alert("Please enter a longer description first so we can suggest a name!");
            return;
        }
        setLoading(true);
        try {
            const res = await fetch('http://localhost:3000/api/suggest-name', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ description: data.description })
            });
            const result = await res.json();
            if (result.name) {
                updateData('projectName', result.name);
            }
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    const handleNext = async () => {
        // Validation
        if (step === 1 && data.description.length < 100) {
            alert("Description must be at least 100 characters.");
            return;
        }

        if (step === 2 || step === 3) {
            const field = step === 2 ? 'platforms' : 'targetUsers';
            if (data[field].length === 0) {
                alert("Please select at least one option.");
                return;
            }
        }

        if (step === 4 && !data.budget) {
            alert("Please select a budget range.");
            return;
        }

        if (step === 4) {
            // Move to step 5 immediately to show loading state
            setStep(5);
            fetchFeatures();
            return;
        }

        if (step < 5) {
            setStep(step + 1);
        } else {
            onComplete(data);
        }
    };

    return (
        <div className="w-full max-w-2xl bg-white shadow-xl rounded-lg overflow-hidden border border-gray-200 p-8">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                    {step === 1 && "Tell us about your project"}
                    {step === 2 && "Where should it run?"}
                    {step === 3 && "Who is it for?"}
                    {step === 4 && "Estimated Budget"}
                    {step === 5 && "Suggested Features"}
                </h2>
                <div className="h-1 w-full bg-gray-200 mt-4 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-red-600 transition-all duration-300"
                        style={{ width: `${(step / 5) * 100}%` }}
                    />
                </div>
            </div>

            <div className="space-y-6">
                {step === 1 && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Project Name (Optional)
                            </label>
                            <div className="flex space-x-2">
                                <input
                                    type="text"
                                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 outline-none"
                                    placeholder="e.g. Project Alpha"
                                    value={data.projectName}
                                    onChange={(e) => updateData('projectName', e.target.value)}
                                />
                                <button
                                    onClick={suggestName}
                                    disabled={loading || data.description.length < 50}
                                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
                                    title="Suggest a name based on description"
                                >
                                    ✨ Suggest
                                </button>
                            </div>
                            {loading ? (
                                <div className="mt-2">
                                    <LoadingAnimation text="Dreaming up names" />
                                </div>
                            ) : (
                                <p className="text-xs text-gray-500 mt-1">Leave blank to auto-generate later, or click Suggest to see one now.</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description (Required)
                            </label>
                            <textarea
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 h-32 focus:ring-2 focus:ring-red-500 outline-none"
                                placeholder="Describe what the project should do..."
                                value={data.description}
                                onChange={(e) => updateData('description', e.target.value)}
                            />
                            <div className="flex justify-end">
                                <span className={`text-xs ${data.description.length < 100 ? 'text-red-500' : 'text-green-600'}`}>
                                    {data.description.length} / 100 characters minimum
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-3">
                        {['Web Portal', 'Mobile App', 'Tablet App'].map(opt => (
                            <label key={opt} className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-red-50 transition-colors">
                                <input
                                    type="checkbox"
                                    className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
                                    checked={data.platforms.includes(opt)}
                                    onChange={() => toggleSelection('platforms', opt)}
                                />
                                <span className="text-gray-700 font-medium">{opt}</span>
                            </label>
                        ))}
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-3">
                        {['Customers', 'Other Businesses (B2B)', 'Internal Staff'].map(opt => (
                            <label key={opt} className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-red-50 transition-colors">
                                <input
                                    type="checkbox"
                                    className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
                                    checked={data.targetUsers.includes(opt)}
                                    onChange={() => toggleSelection('targetUsers', opt)}
                                />
                                <span className="text-gray-700 font-medium">{opt}</span>
                            </label>
                        ))}
                    </div>
                )}

                {step === 4 && (
                    <div className="space-y-3">
                        {['£10,000 to £20,000', '£20,000 to £50,000', '£50,000 to £100,000', 'Over £100,000'].map(opt => (
                            <label key={opt} className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-red-50 transition-colors">
                                <input
                                    type="radio"
                                    name="budget"
                                    className="w-5 h-5 text-red-600 focus:ring-red-500"
                                    checked={data.budget === opt}
                                    onChange={() => updateData('budget', opt)}
                                />
                                <span className="text-gray-700 font-medium">{opt}</span>
                            </label>
                        ))}
                    </div>
                )}

                {step === 5 && (
                    <div className="space-y-3">
                        {loading ? (
                            <div className="flex justify-center py-10">
                                <LoadingAnimation text="Analyzing requirements" />
                            </div>
                        ) : suggestedFeatures.length === 0 ? (
                            <div className="text-center py-4 text-gray-500">
                                No specific features suggested, but you can proceed.
                            </div>
                        ) : (
                            suggestedFeatures.map(opt => (
                                <label key={opt} className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-red-50 transition-colors">
                                    <input
                                        type="checkbox"
                                        className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
                                        checked={data.selectedFeatures.includes(opt)}
                                        onChange={() => toggleSelection('selectedFeatures', opt)}
                                    />
                                    <span className="text-gray-700 font-medium">{opt}</span>
                                </label>
                            ))
                        )}
                    </div>
                )}
            </div>

            <div className="mt-8 flex justify-between">
                {step > 1 ? (
                    <button
                        onClick={() => setStep(step - 1)}
                        disabled={loading}
                        className="px-6 py-2 text-gray-600 hover:text-gray-900 font-medium disabled:opacity-50"
                    >
                        Back
                    </button>
                ) : (
                    <div /> /* Spacer */
                )}
                <button
                    onClick={handleNext}
                    disabled={loading}
                    className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium shadow-lg transition-colors disabled:opacity-50"
                >
                    {step === 5 ? 'Start Scoping' : 'Next'}
                </button>
            </div>
        </div>
    );
};

export default OnboardingFlow;
