import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";
import { Toaster } from "@/components/ui/sonner";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4" dir="rtl">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">الصفحة غير موجودة</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          الصفحة التي تبحث عنها غير موجودة أو تم نقلها.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            العودة للرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "صياغة — منصة المحتوى التسويقي العربي بالذكاء الاصطناعي" },
      {
        name: "description",
        content: "منصة ذكية لصناعة المحتوى التسويقي باللهجات السعودية والخليجية. حوّل روابط منتجاتك إلى نصوص إعلانية احترافية بثوانٍ.",
      },
      { property: "og:title", content: "صياغة — منصة المحتوى التسويقي العربي بالذكاء الاصطناعي" },
      { property: "og:description", content: "Saudi Spark Content is a smart web platform for generating localized marketing content." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "صياغة — منصة المحتوى التسويقي العربي بالذكاء الاصطناعي" },
      { name: "description", content: "Saudi Spark Content is a smart web platform for generating localized marketing content." },
      { name: "twitter:description", content: "Saudi Spark Content is a smart web platform for generating localized marketing content." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/6042b7c6-d649-4770-85e9-0859821cc629/id-preview-7bd51e69--007da2ff-dbfa-4c0a-8af3-266ea2b19aa3.lovable.app-1776792891170.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/6042b7c6-d649-4770-85e9-0859821cc629/id-preview-7bd51e69--007da2ff-dbfa-4c0a-8af3-266ea2b19aa3.lovable.app-1776792891170.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;900&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Outlet />
        <Toaster richColors position="top-center" />
      </AuthProvider>
    </ThemeProvider>
  );
}
