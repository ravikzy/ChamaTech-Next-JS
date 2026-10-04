import { Bricolage_Grotesque, Instrument_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Títulos
const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-bricolage",
});

// Corpo do texto
const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-instrument-sans",
});

// Protocolo e dados
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains-mono",
});

export const metadata = {
  title: "VivaTech",
  description: "Assistência técnica sob demanda — técnicos verificados, perto de você.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={`${bricolage.variable} ${jetbrainsMono.variable} ${instrumentSans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
