import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { loginSchema } from "@/schemas/auth";
import type { LoginFormData } from "@/schemas/auth";

export default function LoginPage() {
    const navigate = useNavigate();
    const { user, isLoading, error, login } = useAuth();
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
            
            // Redirect based on user role from the updated auth state
            if (user) {
                switch (user.role) {
                    case 'city_admin':
                    case 'super_admin':
                        navigate('/city-admin/dashboard');
                        break;
                    case 'center_admin':
                        navigate('/center-admin/dashboard');
                        break;
                    case 'volunteer':
                        navigate('/volunteer/dashboard');
                        break;
                    default:
                        navigate('/city-admin/dashboard');
                }
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
                                    <p className="text-sm text-destructive">{validationErrors.email}</p>
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
                                    className={validationErrors.password ? "border-destructive" : ""}
                                />
                                {validationErrors.password && (
                                    <p className="text-sm text-destructive">{validationErrors.password}</p>
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
                                    className="w-full"
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

            {/* Right side - Map/Image Space */}
            <div className="flex-1 bg-muted hidden lg:flex items-center justify-center p-8">
                <div className="w-full h-full max-w-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center">
                    <div className="text-center space-y-4 text-muted-foreground">
                        <div className="w-16 h-16 mx-auto bg-muted-foreground/20 rounded-full flex items-center justify-center">
                            <svg 
                                className="w-8 h-8" 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                            >
                                <path 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth={1.5} 
                                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" 
                                />
                            </svg>
                        </div>
                        <div>
                            <p className="font-medium">Evacuation Facility Map</p>
                            <p className="text-sm mt-1">System overview and facility locations</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}