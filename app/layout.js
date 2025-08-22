import "./globals.css";

export const metadata = {
  title: "Meeting Scheduler",
  description: "Schedule meetings with calendar integration",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}