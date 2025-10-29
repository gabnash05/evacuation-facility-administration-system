"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Filter, SquarePen, Trash2, ChevronsUpDown, UserRoundCheck, Ambulance, HousePlus, HandHeart } from "lucide-react";

export function VolunteerDashboard() {
  const [entriesPerPage, setEntriesPerPage] = useState(10);

  return (
    <div className="w-full min-w-0 bg-background flex flex-col">
      {/* Quick Action Section */}
      <div className="p-none mt-12">
        <h2 className="text-2xl font-semibold text-center mb-8">Quick Action</h2>
        
        <div className="flex justify-center gap-6 mb-12">
          {[
            { label: "Check-in Evacuee", color: "bg-blue-500", icon: UserRoundCheck },
            { label: "Transfer Individual", color: "bg-red-500", icon: Ambulance },
            { label: "Register Household", color: "bg-orange-500", icon: HousePlus },
            { label: "Distribute Relief", color: "bg-green-500", icon: HandHeart },
          ].map((action, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className={`${action.color} w-20 h-20 rounded-lg flex items-center justify-center text-white shadow-md hover:shadow-lg transition-shadow cursor-pointer relative`}>
                <action.icon className="w-10 h-10" />
              </div>
              <p className="text-sm font-medium text-center">{action.label}</p>
            </div>
          ))}
        </div>

        {/* Active Events Section */}
        <div className="border border-border py-4 text-center mb-0">
          <h2 className="text-2xl font-semibold">Active Events</h2>
        </div>

        {/* Controls Bar */}
        <div className="bg-card border border-border border-t-0 p-4 mb-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Show</span>
              <Input
                type="number"
                value={entriesPerPage}
                onChange={(e) => setEntriesPerPage(Number(e.target.value))}
                className="w-16 h-9 text-center"
                min={1}
              />
              <span>entries</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search..." className="w-64 h-9 pl-9" />
              </div>
              <button className="bg-muted hover:bg-muted/80 p-2 h-9 w-9 flex items-center justify-center border border-border rounded">
                <Filter className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="border border-border border-t-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <div className="flex items-center justify-between">
                    Task ID
                    <ChevronsUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center justify-between">
                    Task
                    <ChevronsUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center justify-between">
                    Center
                    <ChevronsUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center justify-between">
                    Date Declared
                    <ChevronsUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center justify-between">
                    End Date
                    <ChevronsUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center justify-between">
                    Status
                    <ChevronsUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                ["#20462", "Check-in evacuee", "Bagong Silang Barangay Hall/Gym", "13/05/2022", "NA", "Active"],
                ["#18933", "Distribute Relief", "Bagong Silang Barangay Hall/Gym", "22/05/2022", "22/05/2022", "Ongoing"],
                ["#45169", "Distribute Relief", "Bagong Silang Barangay Hall/Gym", "15/06/2022", "15/06/2022", "Closed"],
                ["#54304", "Distribute Relief", "Bagong Silang Barangay Hall/Gym", "06/09/2022", "06/09/2022", "Closed"],
                ["#17188", "Request Aid", "Bagong Silang Barangay Hall/Gym", "25/09/2022", "25/09/2022", "Closed"],
              ].map(([id, task, center, declared, end, status], i) => (
                <TableRow key={i} className={i % 2 === 1 ? "bg-muted" : ""}>
                  <TableCell className="font-medium">{id}</TableCell>
                  <TableCell>{task}</TableCell>
                  <TableCell>{center}</TableCell>
                  <TableCell>{declared}</TableCell>
                  <TableCell>{end}</TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={
                        status === "Active"
                          ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200"
                          : status === "Ongoing"
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                          : "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200"
                      }
                    >
                      {status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <button className="hover:text-primary">
                        <SquarePen className="h-4 w-4" />
                      </button>
                      <button className="hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}