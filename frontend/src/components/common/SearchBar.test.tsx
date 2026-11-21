import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SearchBar } from "./SearchBar";

describe("SearchBar", () => {
    it("uses the provided display value and reports typed text", () => {
        const onChange = vi.fn();

        render(<SearchBar placeholder="Search households" value="Ana" onChange={onChange} />);

        const input = screen.getByPlaceholderText("Search households");
        expect(input).toHaveValue("Ana");

        fireEvent.change(input, { target: { value: "Ana Cruz" } });
        expect(onChange).toHaveBeenCalledWith("Ana Cruz");
    });

    it("is safe to render without an optional change handler", () => {
        render(<SearchBar />);

        fireEvent.change(screen.getByPlaceholderText("Search"), { target: { value: "query" } });
    });
});
