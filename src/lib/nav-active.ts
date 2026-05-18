export function getActiveNavHref(
  pathname: string,
  hrefs: string[]
): string | null {
  const sorted = [...hrefs].sort((a, b) => b.length - a.length);
  for (const href of sorted) {
    if (pathname === href || pathname.startsWith(`${href}/`)) {
      return href;
    }
  }
  return null;
}

export function isNavItemActive(
  pathname: string,
  href: string,
  allHrefs: string[]
): boolean {
  return getActiveNavHref(pathname, allHrefs) === href;
}
