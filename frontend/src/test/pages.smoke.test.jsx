import { beforeEach, describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "../i18n/index.js";
import Home from "../pages/Home.jsx";
import Alphabet from "../pages/Alphabet.jsx";

beforeEach(() => {
  localStorage.clear();
});

describe("smoke tests: pages render without throwing", () => {
  test("Home renders the new-profile form when no profiles exist", () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );
    expect(screen.getByText(/ABC Mundo/)).toBeInTheDocument();
  });

  test("Alphabet renders a letter card using the default language pair", () => {
    render(
      <MemoryRouter>
        <Alphabet />
      </MemoryRouter>
    );
    expect(screen.getAllByText(/Alfabeto/).length).toBeGreaterThan(0);
  });
});
