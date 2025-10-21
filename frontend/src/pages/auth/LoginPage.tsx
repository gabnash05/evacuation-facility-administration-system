import AuthLayout from '@/layouts/AuthLayout';

export default function LoginPage() {
    return (
        <AuthLayout title="Welcome Back">
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Email
                    </label>
                    <input
                        type="email"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                        placeholder="Enter your email"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Password
                    </label>
                    <input
                        type="password"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                        placeholder="Enter your password"
                    />
                </div>
                <div className="flex flex-col space-y-3">
                    <button 
                        className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
                        onClick={() => window.location.href = '/city-admin/dashboard'}
                    >
                        Mock Login as City Admin
                    </button>
                    <button 
                        className="w-full bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors"
                        onClick={() => window.location.href = '/center-admin/dashboard'}
                    >
                        Mock Login as Center Admin
                    </button>
                    <button 
                        className="w-full bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded transition-colors"
                        onClick={() => window.location.href = '/volunteer/dashboard'}
                    >
                        Mock Login as Volunteer
                    </button>
                </div>
            </div>
        </AuthLayout>
    );
}