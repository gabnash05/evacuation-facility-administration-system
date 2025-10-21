import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export function CityAdminDashboard() {
    return (
        <div className="w-full min-w-0 bg-background">
            <div className="w-full p-8">
                <Card className="w-full border-none shadow-none">
                    <CardHeader className="px-0 pt-0">
                        <CardTitle className="text-4xl font-bold">City Admin Dashboard</CardTitle>
                        <CardDescription className="text-lg mt-4">
                            Welcome to the City Admin dashboard.
                        </CardDescription>
                    </CardHeader>
                </Card>
                
                {/* Stats Cards */}
                <div className="min-w-max mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="min-w-max">
                        <CardHeader>
                            <CardTitle className="text-xl">Evacuation Centers</CardTitle>
                            <CardDescription>Manage all evacuation centers</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">12</p>
                            <p className="text-sm text-muted-foreground">Active centers</p>
                        </CardContent>
                    </Card>

                    <Card className="min-w-max">
                        <CardHeader>
                            <CardTitle className="text-xl">Evacuation Centers</CardTitle>
                            <CardDescription>Manage all evacuation centers</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">12</p>
                            <p className="text-sm text-muted-foreground">Active centers</p>
                        </CardContent>
                    </Card>
                    
                    <Card className="min-w-max">
                        <CardHeader>
                            <CardTitle className="text-xl">Events</CardTitle>
                            <CardDescription>Manage emergency events</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">3</p>
                            <p className="text-sm text-muted-foreground">Ongoing events</p>
                        </CardContent>
                    </Card>
                    
                    <Card className="min-w-max">
                        <CardHeader>
                            <CardTitle className="text-xl">Households</CardTitle>
                            <CardDescription>Manage household data</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">1,247</p>
                            <p className="text-sm text-muted-foreground">Registered households</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Activity Table */}
                <Card className="min-w-max mt-8">
                    <CardHeader>
                        <CardTitle className="text-2xl">Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="min-w-max overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Event</TableHead>
                                        <TableHead>Center</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <TableRow>
                                        <TableCell className="font-medium">Typhoon Alert</TableCell>
                                        <TableCell>Central High School</TableCell>
                                        <TableCell>2024-01-15</TableCell>
                                        <TableCell>
                                            <Badge variant="default">Active</Badge>
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-medium">Earthquake Drill</TableCell>
                                        <TableCell>City Sports Complex</TableCell>
                                        <TableCell>2024-01-10</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">Completed</Badge>
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-medium">Flood Warning</TableCell>
                                        <TableCell>Riverside Elementary</TableCell>
                                        <TableCell>2024-01-08</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">Monitoring</Badge>
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}