const supportedLocales = new Set(["en", "fr"]);

export function stripLocalePrefix(pathname) {
  const segments = pathname.split("/");
  if (supportedLocales.has(segments[1])) {
    const path = `/${segments.slice(2).join("/")}`;
    return path === "/" ? "/" : path.replace(/\/$/, "");
  }
  return pathname;
}

export function isAdminPath(pathname) {
  const path = stripLocalePrefix(pathname);
  return path === "/dashboard/admin" || path.startsWith("/dashboard/admin/");
}
