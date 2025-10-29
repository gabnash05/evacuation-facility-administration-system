"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Map, ChevronsUpDown } from "lucide-react";

export function CenterAdminDashboard() {
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [centerStatus, setCenterStatus] = useState("Active");

  const getStatusStyles = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-red-100 text-red-700 border-red-100 dark:bg-red-900 dark:text-red-200 dark:border-red-900";
      case "Recovery":
        return "bg-yellow-100 text-yellow-800 border-yellow-100 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-900";
      case "Closed":
        return "bg-green-100 text-green-700 border-green-100 dark:bg-green-900 dark:text-green-200 dark:border-green-900";
      default:
        return "bg-red-100 text-red-700 border-red-100 dark:bg-red-900 dark:text-red-200 dark:border-red-900";
    }
  };

  return (
    <div className="w-full min-w-0 bg-background flex flex-col relative">
      {/* === MAP + RIGHT PANEL === */}
      <div className="relative w-full h-[43vh] border-b border-border flex">
        {/* Map Placeholder */}
        <div className="flex-1 bg-muted/30 flex items-center justify-center text-muted-foreground">
          <p>Map Placeholder</p>
        </div>

        {/* Right Info Panel - No floating, no radius */}
        <div className="w-[500px] bg-card border-l border-border">
          <div className="p-6">
            <div className="flex items-start gap-4 mb-5">
              <div className="flex-1">
                <h2 className="text-3xl font-semibold text-foreground leading-tight">
                  Bagong Silang<br />
                  Barangay Gym/<br />
                  Hall
                </h2>
              </div>
              <div className="w-40 h-28 bg-muted rounded-lg" />
            </div>

            <div className="space-y-4">
              {/* Barangay Row */}
              <div className="flex items-center gap-3">
                <div className="w-48 flex-none">
                  <p className="text-xs text-muted-foreground mb-1">Barangay</p>
                  <div className="border border-border rounded-lg px-3 py-2 bg-background flex items-center justify-between">
                    <p className="text-sm font-medium">Hinaplanon</p>
                    <Map className="h-6 w-6 text-muted-foreground" />
                  </div>
                </div>
                <div className="w-40 flex-none">
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  <Select value={centerStatus} onValueChange={setCenterStatus}>
                    <SelectTrigger className={`rounded-lg px-3 py-2 text-sm font-medium h-auto w-full ${getStatusStyles(centerStatus)}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Recovery">Recovery</SelectItem>
                      <SelectItem value="Closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Capacity and Current Row */}
              <div className="flex items-center gap-3">
                <div className="w-30">
                  <p className="text-xs text-muted-foreground mb-1">Capacity</p>
                  <div className="border border-border rounded-lg px-3 py-2 bg-background">
                    <p className="text-sm font-medium">500</p>
                  </div>
                </div>
                <div className="w-30">
                  <p className="text-xs text-muted-foreground mb-1">Current Occupancy</p>
                  <div className="border border-border rounded-lg px-3 py-2 bg-background">
                    <p className="text-sm font-medium">300</p>
                  </div>
                </div>
                <div className="w-20">
                  <p className="text-xs text-muted-foreground mb-1">Usage</p>
                  <div className="border border-border rounded-lg px-3 py-2 bg-yellow-100 text-center">
                    <p className="text-sm font-semibold text-black">60%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* === STATS ROW === */}
      <div className="w-full bg-card border-b border-border flex justify-around py-4 text-center">
        {[
          { label: "Total Checked In", value: "300", max: "1000" },
          { label: "Total Checked Out", value: "271", max: "500" },
          { label: "Total Missing", value: "5", max: "" },
          { label: "Total Unaccounted", value: "429", max: "1000" },
        ].map((stat, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 border-2 border-muted rounded-full flex items-center justify-center text-xs font-medium">
                25%
              </div>
              <div className="text-xl font-semibold">{stat.value}</div>
              <p className="text-sm text-muted-foreground">/{stat.max}</p>
            </div>
            <p className="text-sm font-medium">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* === EVENT HISTORY TABLE === */}
      <div className="p-0">
        {/* Controls Bar with Background */}
        <div className="bg-card border border-border p-4">
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
              <span>Entries</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search" className="w-64 h-9 pl-9" />
              </div>
            </div>
          </div>
        </div>

        {/* Table with Event History inside */}
        <div className="border border-border">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-base text-foreground">Event History</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <div className="flex items-center justify-between">
                    Event ID
                    <ChevronsUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center justify-between">
                    Event Name
                    <ChevronsUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center justify-between">
                    Event Type
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                ["#20462", "Palao Fire", "Fire", "13/05/2022", "NA", "Active"],
                ["#18933", "June Flash Flood", "Flood", "22/05/2022", "22/05/2022", "Recovery"],
                ["#45169", "July Storm Surge", "Flood", "15/06/2022", "15/06/2022", "Closed"],
                ["#54304", "Tibanga Flood", "Flood", "06/09/2022", "06/09/2022", "Closed"],
                ["#17188", "Typhoon Odette", "Typhoon", "25/09/2022", "25/09/2022", "Closed"],
                ["#17188", "Typhoon Odette", "Typhoon", "25/09/2022", "25/09/2022", "Closed"],
              ].map(([id, name, type, declared, end, status], i) => (
                <TableRow key={i} className={i % 2 === 1 ? "bg-muted" : ""}>
                  <TableCell className="font-medium">{id}</TableCell>
                  <TableCell>{name}</TableCell>
                  <TableCell>{type}</TableCell>
                  <TableCell>{declared}</TableCell>
                  <TableCell>{end}</TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={
                        status === "Active"
                          ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200"
                          : status === "Recovery"
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                          : "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200"
                      }
                    >
                      {status}
                    </Badge>
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