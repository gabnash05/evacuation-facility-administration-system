import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth.mock';

export default function LoginPage() {
    const navigate = useNavigate();
    const { user } = useAuth(); // Get the mock user from useAuth

    const handleLogin = () => {
        // Redirect based on the mock user's role from useAuth
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
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="Enter your email"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Enter your password"
                            />
                        </div>
                        
                        {/* Single Login Button */}
                        <div className="pt-4">
                            <Button 
                                variant="default"
                                className="w-full"
                                onClick={handleLogin}
                                size="lg"
                            >
                                Login
                            </Button>
                        </div>

                        {/* Mock User Info (for development) */}
                        {user && (
                            <div className="text-xs text-muted-foreground text-center border-t pt-3">
                                <p>Mock Mode: Logging in as <strong>{user.role}</strong></p>
                                <p className="text-[10px] opacity-70">Change MOCK_ROLE in useAuth to test different roles</p>
                            </div>
                        )}
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