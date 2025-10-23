// App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { CityAdminDashboardSample } from "@/pages/samples/CityAdminDashboardSample";

import { CityAdminDashboard } from "./pages/city-admin/CityAdminDashboard";
import { CityAdminCentersPage } from "@/pages/city-admin/CityAdminCentersPage";
import { CityAdminEventsPage } from "./pages/city-admin/CityAdminEventsPage";
import { CityAdminHouseholdsPage } from "./pages/city-admin/CityAdminHouseholdsPage";

import { CenterAdminDashboard } from "@/pages/center-admin/CenterAdminDashboard";
import { CenterAdminHouseholdsPage } from "./pages/center-admin/CenterAdminHouseholds";

import { VolunteerDashboard } from "@/pages/volunteer/VolunteerDashboard";

import MainLayout from "@/layouts/MainLayout";
import LoginPage from "@/pages/auth/LoginPage";
import ProtectedRoute from "@/components/features/auth/ProtectedRoute";

// Mock page components
const UnauthorizedPage = () => (
    <div className="min-h-screen flex items-center justify-center">Unauthorized Access</div>
);

function App() {
    return (
        <Router>
            <Routes>
                {/* Public routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/unauthorized" element={<UnauthorizedPage />} />

                {/* Protected routes - Single Routes wrapper */}
                <Route
                    path="/city-admin/*"
                    element={
                        <ProtectedRoute requiredRole={["city_admin", "super_admin"]}>
                            <MainLayout>
                                <Routes>
                                    <Route path="dashboard" element={<CityAdminDashboard />} />
                                    <Route path="centers" element={<CityAdminCentersPage />} />
                                    <Route path="events" element={<CityAdminEventsPage />} />
                                    <Route
                                        path="households"
                                        element={<CityAdminHouseholdsPage />}
                                    />
                                    <Route path="*" element={<Navigate to="dashboard" replace />} />
                                </Routes>
                            </MainLayout>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/center-admin/*"
                    element={
                        <ProtectedRoute requiredRole={["center_admin"]}>
                            <MainLayout>
                                <Routes>
                                    <Route path="dashboard" element={<CenterAdminDashboard />} />
                                    <Route
                                        path="households"
                                        element={<CenterAdminHouseholdsPage />}
                                    />
                                    <Route path="*" element={<Navigate to="dashboard" replace />} />
                                </Routes>
                            </MainLayout>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/volunteer/*"
                    element={
                        <ProtectedRoute requiredRole={["volunteer"]}>
                            <MainLayout>
                                <Routes>
                                    <Route path="dashboard" element={<VolunteerDashboard />} />
                                    <Route path="*" element={<Navigate to="dashboard" replace />} />
                                </Routes>
                            </MainLayout>
                        </ProtectedRoute>
                    }
                />

                {/* Default redirect */}
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </Router>
    );
}

export default App;
