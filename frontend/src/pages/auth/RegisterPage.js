import React from 'react';
import { SignUp } from '@clerk/clerk-react';
import Navbar from '../../components/Navbar';

const RegisterPage = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50">
            <Navbar />
            <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-600 rounded-2xl mb-4 shadow-lg">
                        <span className="text-white text-2xl font-bold">eN</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Create your citizen account</h1>
                    <p className="text-gray-500 text-sm mt-1">Join e-Nagar Suraksha and report civic issues in your city.</p>
                </div>

                {/* Password guidance — shown BEFORE Clerk form to pre-empt breach errors */}
                <div className="w-full max-w-sm mb-4">
                    <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
                        <p className="text-xs font-semibold text-blue-800 mb-1.5">🔒 Password Requirements</p>
                        <ul className="text-xs text-blue-700 space-y-0.5 list-none">
                            <li>✅ At least <strong>8 characters</strong></li>
                            <li>✅ Mix of <strong>uppercase</strong> and <strong>lowercase</strong> letters</li>
                            <li>✅ At least one <strong>number</strong></li>
                            <li>✅ At least one <strong>special character</strong> (e.g. <code>@#$!%</code>)</li>
                            <li>⛔ Must <strong>not</strong> be a commonly-used or breached password</li>
                        </ul>
                        <p className="text-xs text-blue-600 mt-2 font-medium">
                            💡 Example: <code className="bg-blue-100 px-1 py-0.5 rounded">Nagar@2024!</code>
                        </p>
                        <p className="text-xs text-blue-500 mt-1">
                            If you see <em>"password found in a breach"</em>, choose a more unique password.
                        </p>
                    </div>
                </div>

                {/* Clerk SignUp component handles all registration flows */}
                <SignUp
                    routing="hash"
                    afterSignUpUrl="/clerk-callback"
                    signInUrl="/login"
                    appearance={{
                        elements: {
                            rootBox: 'mx-auto',
                            card: 'shadow-sm border border-gray-200 rounded-xl',
                            headerTitle: 'hidden',
                            headerSubtitle: 'hidden',
                            socialButtonsBlockButton: 'border border-gray-300 hover:bg-gray-50',
                            formButtonPrimary: 'bg-primary-600 hover:bg-primary-700 text-sm',
                            footerActionLink: 'text-primary-600 hover:text-primary-700',
                        },
                    }}
                />
            </div>
        </div>
    );
};

export default RegisterPage;
