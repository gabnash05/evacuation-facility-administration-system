import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { loginSchema } from "@/schemas/auth";
import type { LoginFormData } from "@/schemas/auth";
import { useAuthStore } from "@/store/authStore";
import { StaticMap } from "@/components/features/map/StaticMap";
import efasLogo from "@/assets/logo/efas-logo.png"; // Import the logo

export default function LoginPage() {
    const navigate = useNavigate();
    const { isLoading, error, login } = useAuth();
    const [formData, setFormData] = useState<LoginFormData>({
        email: "",
        password: "",
    });
    const [validationErrors, setValidationErrors] = useState<Partial<LoginFormData>>({});
    const [loginError, setLoginError] = useState<string | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear validation error when user types
        if (validationErrors[name as keyof LoginFormData]) {
            setValidationErrors(prev => ({ ...prev, [name]: undefined }));
        }
        // Clear login error when user types
        if (loginError) {
            setLoginError(null);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoginError(null);

        // Validate form
        const validationResult = loginSchema.safeParse(formData);
        if (!validationResult.success) {
            const errors: Partial<LoginFormData> = {};
            validationResult.error.issues.forEach(issue => {
                errors[issue.path[0] as keyof LoginFormData] = issue.message;
            });
            setValidationErrors(errors);
            return;
        }

        try {
            // Use AuthService directly for login
            await login(formData);

            // Get the user from the auth store after login
            const { user } = useAuthStore.getState();

            if (!user) {
                throw new Error("User data not available after login");
            }

            // Redirect based on the actual user role
            switch (user.role) {
                case "city_admin":
                case "super_admin":
                    navigate("/city-admin/dashboard");
                    break;
                case "center_admin":
                    navigate("/center-admin/dashboard");
                    break;
                case "volunteer":
                    navigate("/volunteer/dashboard");
                    break;
                default:
                    navigate("/city-admin/dashboard");
            }
        } catch (err) {
            setLoginError(err instanceof Error ? err.message : "Login failed");
            console.error("Login failed:", err);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left side - Login Card */}
            <div className="flex-1 flex items-center justify-center p-8">
                <Card className="w-full max-w-md shadow-sm dark:shadow-md">
                    <CardHeader className="space-y-1">
                        {/* Add the logo here */}
                        <div className="flex justify-center">
                            <img 
                                src={efasLogo} 
                                alt="EFAS Logo" 
                                className="h-40 w-auto"
                            />
                        </div>
                        <CardTitle className="text-2xl font-bold text-center">
                            Welcome Back
                        </CardTitle>
                        <CardDescription className="text-center">
                            Enter your credentials to access the EFAS system
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="Enter your email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className={validationErrors.email ? "border-destructive" : ""}
                                />
                                {validationErrors.email && (
                                    <p className="text-sm text-destructive">
                                        {validationErrors.email}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    placeholder="Enter your password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    className={
                                        validationErrors.password ? "border-destructive" : ""
                                    }
                                />
                                {validationErrors.password && (
                                    <p className="text-sm text-destructive">
                                        {validationErrors.password}
                                    </p>
                                )}
                            </div>

                            {/* Error messages */}
                            {loginError && (
                                <div className="p-3 text-sm text-destructive bg-destructive/15 rounded-md">
                                    {loginError}
                                </div>
                            )}
                            {error && (
                                <div className="p-3 text-sm text-destructive bg-destructive/15 rounded-md">
                                    {error}
                                </div>
                            )}

                            {/* Login Button */}
                            <div className="pt-4">
                                <Button
                                    type="submit"
                                    variant="default"
                                    className="w-full cursor-pointer"
                                    disabled={isLoading}
                                    size="lg"
                                >
                                    {isLoading ? "Logging in..." : "Login"}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>

            {/* Right side - Static Map */}
            <div className="flex-1 bg-muted hidden lg:flex items-center justify-center p-8">
                <div className="w-full h-full max-w-2xl rounded-lg overflow-hidden shadow-lg">
                    <StaticMap 
                        center={[8.230205, 124.249607]}
                        zoom={13}
                    />
                </div>
            </div>
        </div>
    );
}