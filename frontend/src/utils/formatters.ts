export function formatDate(date: string): string {
    return new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

export function formatCapacity(current: number, total: number): string {
    return `${current}/${total} (${Math.round((current / total) * 100)}%)`;
}
