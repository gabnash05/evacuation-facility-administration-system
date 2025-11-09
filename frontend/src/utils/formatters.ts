export function formatDate(date: string): string {
    return new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

export function parseDate(dateStr: string): Date | undefined {
    if (!dateStr || dateStr === "NA" || dateStr === "N/A") return undefined;

    // Handle ISO format with time (e.g., "2025-11-10 00:00:00")
    if (dateStr.includes("-") && dateStr.includes(" ")) {
        // Replace space with 'T' to make it ISO-compliant
        const isoFormatted = dateStr.replace(" ", "T");
        const parsedDate = new Date(isoFormatted);
        return isNaN(parsedDate.getTime()) ? undefined : parsedDate;
    }

    // Handle DD/MM/YYYY format (from your CreateEventModal)
    if (dateStr.includes("/")) {
        const [day, month, year] = dateStr.split("/");
        if (!day || !month || !year) return undefined;
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }

    // Handle other date formats (ISO strings, etc.)
    const parsedDate = new Date(dateStr);
    return isNaN(parsedDate.getTime()) ? undefined : parsedDate;
}

export function formatCapacity(current: number, total: number): string {
    return `${current}/${total} (${Math.round((current / total) * 100)}%)`;
}
