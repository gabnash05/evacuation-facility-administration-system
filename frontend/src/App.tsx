// App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import { CityAdminDashboard } from "./pages/city-admin/CityAdminDashboard";
import { CityAdminCentersPage } from "@/pages/city-admin/CityAdminCentersPage";
import { CityAdminHouseholdsPage } from "./pages/city-admin/CityAdminHouseholdsPage";
import { CityAdminAttendancePage } from "./pages/city-admin/CityAdminAttendancePageV2";
import { CityAdminDistributionPage } from "@/pages/city-admin/CityAdminDistributionPage";
import { CityAdminAidAllocationPage } from "./pages/city-admin/CityAdminAidAllocationPage";

import { CenterAdminDashboard } from "@/pages/center-admin/CenterAdminDashboard";
import { CenterAdminHouseholdsPage } from "./pages/center-admin/CenterAdminHouseholds";
import { CenterAdminAttendancePage } from "./pages/center-admin/CenterAdminAttendancePageV2";
import { CenterAdminAidAllocationPage } from "./pages/center-admin/CenterAdminAidAllocationPage";

import { VolunteerDashboard } from "@/pages/volunteer/VolunteerDashboard";
import { VolunteerHouseholdsPage } from "./pages/volunteer/VolunteerHouseholdsPage";
import { VolunteerAttendancePage } from "./pages/volunteer/VolunteerAttendancePageV2";
import VolunteerDistributeAidPage from "@/pages/volunteer/VolunteerDistributeAidPage";

import MainLayout from "@/layouts/MainLayout";
import LoginPage from "@/pages/auth/LoginPage";
import ProtectedRoute from "@/components/features/auth/ProtectedRoute";
import { CityAdminUserManagementPage } from "./pages/city-admin/CityAdminUserMangementPage";
import { CenterAdminUserManagementPage } from "./pages/center-admin/CenterAdminUserManagementPage";

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
                        <ProtectedRoute
                            requiredRole={["center_admin", "city_admin", "super_admin"]}
                        >
                            <MainLayout>
                                <Routes>
                                    <Route path="dashboard" element={<CityAdminDashboard />} />
                                    <Route path="centers" element={<CityAdminCentersPage />} />
                                    <Route
                                        path="households"
                                        element={<CityAdminHouseholdsPage />}
                                    />
                                    <Route
                                        path="user-management"
                                        element={<CityAdminUserManagementPage />}
                                    />
                                    <Route
                                        path="attendance"
                                        element={<CityAdminAttendancePage />}
                                    />
                                    <Route
                                        path="aid-allocation"
                                        element={<CityAdminAidAllocationPage />}
                                    />{" "}
                                    {/* replace with actual page when available */}
                                    <Route
                                        path="reports-and-analytics"
                                        element={<div>Reports and Analytics Page</div>}
                                    />{" "}
                                    {/* replace with actual page when available */}
                                    <Route
                                    path="distribution-records" 
                                    element={<CityAdminDistributionPage />}
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
                        <ProtectedRoute
                            requiredRole={[
                                "center_admin",
                                "city_admin",
                                "super_admin",
                                "city_admin",
                                "super_admin",
                            ]}
                        >
                            <MainLayout>
                                <Routes>
                                    <Route 
                                        path="dashboard" 
                                        element={<CenterAdminDashboard />} />
                                    <Route
                                        path="households"
                                        element={<CenterAdminHouseholdsPage />}
                                    />
                                    <Route 
                                        path="attendance" 
                                        element={<CenterAdminAttendancePage/>} />
                                    <Route
                                        path="user-management"
                                        element={<CenterAdminUserManagementPage />}
                                    />{" "}
                                    {/* replace with actual page when available */}
                                    <Route
                                        path="aid-allocation"
                                        element={<CenterAdminAidAllocationPage />}
                                    />{" "}
                                    {/* replace with actual page when available */}
                                    <Route
                                        path="reports-and-analytics"
                                        element={<div>Reports and Analytics Page</div>}
                                    />{" "}
                                    {/* replace with actual page when available */}
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
                                    <Route 
                                        path="dashboard" 
                                        element={<VolunteerDashboard />} 
                                    />
                                    <Route
                                        path="attendance"
                                        element={<VolunteerAttendancePage />}
                                    />
                                    <Route
                                        path="households"
                                        element={<VolunteerHouseholdsPage />}
                                    />
                                    <Route
                                        path="aid-distribution"
                                        element={<VolunteerDistributeAidPage />}
                                    />{" "}
                                    {/* replace with actual page when available */}
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
