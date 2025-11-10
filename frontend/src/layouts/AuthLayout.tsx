interface AuthLayoutProps {
    children: React.ReactNode;
    title?: string;
}

export default function AuthLayout({ children, title = "Sign in" }: AuthLayoutProps) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#041025] p-4">
            <div className="w-full max-w-md bg-white dark:bg-[#061226] border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm p-6">
                <h1 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
                    {title}
                </h1>
                <div>{children}</div>
            </div>
        </div>
    );
}
