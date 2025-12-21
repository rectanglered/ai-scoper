import React, { useState } from 'react';

const ContactForm = ({ onSubmit }) => {
    const [formData, setFormData] = useState({
        name: '',
        company: '',
        jobTitle: '',
        email: '',
        phone: ''
    });
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError(''); // Clear error on edit
    };

    const validateEmail = (email) => {
        // Basic format check
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!re.test(email)) return "Invalid email format";

        // Business email check (block generic domains)
        const genericDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com'];
        const domain = email.split('@')[1]?.toLowerCase();

        if (genericDomains.includes(domain)) {
            return "Please use a business email address (no gmail, hotmail, etc.)";
        }
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Check all fields present
        if (!formData.name || !formData.company || !formData.jobTitle || !formData.email || !formData.phone) {
            setError("All fields are required.");
            return;
        }

        // Validate email
        const emailError = validateEmail(formData.email);
        if (emailError) {
            setError(emailError);
            return;
        }

        setSubmitting(true);
        await onSubmit(formData);
        setSubmitting(false);
    };

    return (
        <div className="w-full max-w-lg bg-white shadow-xl rounded-lg overflow-hidden border border-gray-200 p-8">
            <div className="flex items-center space-x-4 mb-8 bg-red-50 p-4 rounded-lg border border-red-100">
                <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-white shadow-sm">
                    <img src="/daniel_avatar.png" alt="Daniel" className="w-full h-full object-cover" />
                </div>
                <div>
                    <p className="text-gray-900 font-medium">Almost there!</p>
                    <p className="text-sm text-gray-600">I just need a few contact details to send your report.</p>
                </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-2">Final Step: Contact Details</h2>
            <p className="text-gray-600 mb-6">To receive your free project scope report, please provide your business contact details.</p>

            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm border border-red-100">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 outline-none placeholder:text-gray-400 placeholder:font-light placeholder:italic"
                        placeholder="John Doe"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                    <input
                        type="text"
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 outline-none placeholder:text-gray-400 placeholder:font-light placeholder:italic"
                        placeholder="Acme Corp"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                    <input
                        type="text"
                        name="jobTitle"
                        value={formData.jobTitle}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 outline-none placeholder:text-gray-400 placeholder:font-light placeholder:italic"
                        placeholder="CTO"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Business Email</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 outline-none placeholder:text-gray-400 placeholder:font-light placeholder:italic"
                        placeholder="john@acme.com"
                    />
                    <p className="text-xs text-gray-400 mt-1">Must be a company email address.</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 outline-none placeholder:text-gray-400 placeholder:font-light placeholder:italic"
                        placeholder="+44 7700 900000"
                    />
                </div>

                <button
                    type="submit"
                    disabled={submitting}
                    className="w-full mt-6 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg shadow-lg transition-colors disabled:opacity-50"
                >
                    {submitting ? 'Submitting...' : 'View My Report'}
                </button>
            </form>
        </div>
    );
};

export default ContactForm;
