import { Inter_Tight, Orbitron } from "next/font/google";

/** The home page's display and body fonts, shared by every page that uses its look. */
export const display = Orbitron({ variable: "--font-display", subsets: ["latin"], weight: ["500", "700", "900"] });
export const grotesk = Inter_Tight({ variable: "--font-grotesk", subsets: ["latin"], weight: ["300", "400", "500", "800"] });

export const fontVariables = `${display.variable} ${grotesk.variable}`;
