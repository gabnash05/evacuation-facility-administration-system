// App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CityAdminDashboard } from '@/pages/samples/CityAdminDashboardSample';
import MainLayout from '@/layouts/MainLayout';
import LoginPage from '@/pages/auth/login/LoginPage';
import ProtectedRoute from '@/components/features/auth/ProtectedRoute';

// Mock page components
const DashboardPage = () => <div className="p-6">Dashboard Content</div>;
const CentersPage = () => <div className="p-6">Evacuation Centers Management</div>;
const EventsPage = () => <div className="p-6">Events Management</div>;
const HouseholdsPage = () => <div className="p-6">Households Management</div>;
const UnauthorizedPage = () => <div className="min-h-screen flex items-center justify-center">Unauthorized Access</div>;

function App() {
    return (
        <Router>
            <Routes>
                {/* Public routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/unauthorized" element={<UnauthorizedPage />} />
                
                {/* Protected routes - Single Routes wrapper */}
                <Route path="/city-admin/*" element={
                    <ProtectedRoute requiredRole={['city_admin', 'super_admin']}>
                        <MainLayout>
                            <Routes>
                                <Route path="dashboard" element={<CityAdminDashboard />} />
                                <Route path="centers" element={<CentersPage />} />
                                <Route path="events" element={<EventsPage />} />
                                <Route path="households" element={<HouseholdsPage />} />
                                <Route path="*" element={<Navigate to="dashboard" replace />} />
                            </Routes>
                        </MainLayout>
                    </ProtectedRoute>
                } />
                
                <Route path="/center-admin/*" element={
                    <ProtectedRoute requiredRole={['center_admin']}>
                        <MainLayout>
                            <Routes>
                                <Route path="dashboard" element={<DashboardPage />} />
                                <Route path="households" element={<HouseholdsPage />} />
                                <Route path="*" element={<Navigate to="dashboard" replace />} />
                            </Routes>
                        </MainLayout>
                    </ProtectedRoute>
                } />
                
                <Route path="/volunteer/*" element={
                    <ProtectedRoute requiredRole={['volunteer']}>
                        <MainLayout>
                            <Routes>
                                <Route path="dashboard" element={<DashboardPage />} />
                                <Route path="*" element={<Navigate to="dashboard" replace />} />
                            </Routes>
                        </MainLayout>
                    </ProtectedRoute>
                } />
                
                {/* Default redirect */}
                <Route path="/" element={<Navigate to="/city-admin/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/city-admin/dashboard" replace />} />
            </Routes>
        </Router>
    );
}

export default App;