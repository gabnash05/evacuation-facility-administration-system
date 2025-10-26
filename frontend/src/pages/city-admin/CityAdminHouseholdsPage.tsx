import HouseholdTable from "@/components/features/auth/household/HouseholdTable";

export function CityAdminHouseholdsPage() {
    const headersforCityAdmin = ["Household Name", "Household Head", "Address", "Evacuation Center"];

     return (
    <div className="w-full bg-background text-foreground p-8">
      <h1 className="text-3xl font-bold mb-6">City Admin - Household Management</h1>
      
      {/* 3. Use the component and pass the headers as a prop */}
      <div className="border border-border rounded-lg bg-card">
        <HouseholdTable
        headers={headersforCityAdmin}
        caption="List of Households" 
        />
      </div>

    </div>
  );

}
