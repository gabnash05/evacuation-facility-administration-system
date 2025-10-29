"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { SquarePen, Trash2, UserRoundCheck, Ambulance, HousePlus, HandHeart } from "lucide-react";
import { DataTable } from "@/components/common/DataTable";
import { SearchBar } from "@/components/common/SearchBar";

export function VolunteerDashboard() {
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");

  // Active Events data - removed id field
  const activeEventsData = [
    { task: "Check-in evacuee", center: "Bagong Silang Barangay Hall/Gym", dateDeclared: "13/05/2022", endDate: "NA", status: "Active" },
    { task: "Distribute Relief", center: "Bagong Silang Barangay Hall/Gym", dateDeclared: "22/05/2022", endDate: "22/05/2022", status: "Ongoing" },
    { task: "Distribute Relief", center: "Bagong Silang Barangay Hall/Gym", dateDeclared: "15/06/2022", endDate: "15/06/2022", status: "Closed" },
    { task: "Distribute Relief", center: "Bagong Silang Barangay Hall/Gym", dateDeclared: "06/09/2022", endDate: "06/09/2022", status: "Closed" },
    { task: "Request Aid", center: "Bagong Silang Barangay Hall/Gym", dateDeclared: "25/09/2022", endDate: "25/09/2022", status: "Closed" },
  ];

  // Columns without Task ID
  const taskColumns = [
    { key: "task", label: "Task" },
    { key: "center", label: "Center" },
    { key: "dateDeclared", label: "Date Declared" },
    { key: "endDate", label: "End Date" },
    { key: "status", label: "Status" },
  ];

  const renderActions = (row: any, index: number) => (
    <div className="flex items-center gap-2">
      <button className="hover:text-primary">
        <SquarePen className="h-4 w-4" />
      </button>
      <button className="hover:text-destructive">
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );

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
        <div className="bg-card border border-border border-t-0 p-4">
          <div className="flex items-center gap-6">
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

            <SearchBar 
              placeholder="Search..." 
              value={searchQuery}
              onChange={setSearchQuery}
            />
          </div>
        </div>

        {/* Active Events Table */}
        <DataTable
          columns={taskColumns}
          data={activeEventsData}
          renderActions={renderActions}
          showTitle={false}
        />
      </div>
    </div>
  );
}