import "./globals.css";

export const metadata = {
  title: "مكتبة القسم | المنصة الدراسية",
  description: "مكتبة رقمية منظمة لملفات القسم الدراسي",
};

export default function RootLayout({ children }) {
  return <html lang="ar" dir="rtl"><body>{children}</body></html>;
}
