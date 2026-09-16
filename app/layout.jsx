import "./globals.css";
import Providers from "@/components/layout/Providers";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
export const metadata = {
  title: {
    default: "FarmDirect — From Farmers. To You.",
    template: "%s | FarmDirect",
  },
  description:
    "Connect directly with trusted farmers. Fresh. Affordable. Sustainable.",
};
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Navbar />
          <main>{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
