"use client";

// -----------------------------------------------------------------------------
// Wrapper um next-themes: schaltet die CSS-Klasse "dark" auf <html>, damit
// unsere in globals.css definierten Dark-Mode-Tokens greifen.
// -----------------------------------------------------------------------------
import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

export function ThemeProvider({ children, ...props }: ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem {...props}>
      {children}
    </NextThemesProvider>
  );
}
