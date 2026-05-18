import {
  Building2,
  ClipboardList,
  FilePlus2,
  Image,
  LayoutDashboard,
  Settings2,
  Users,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

export function buildManageNav(
  environmentId: string,
  isPrimary: boolean,
  multiEnvironment: boolean,
  includeAdminLink: boolean
): NavItem[] {
  const items: NavItem[] = [
    {
      href: `/manage/${environmentId}`,
      label: "לוח בקרה",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      href: `/manage/${environmentId}/questionnaires`,
      label: "השאלונים שלי",
      icon: <ClipboardList className="h-5 w-5" />,
    },
    {
      href: `/manage/${environmentId}/questionnaires/new`,
      label: "הקמת שאלון",
      icon: <FilePlus2 className="h-5 w-5" />,
    },
    {
      href: `/manage/${environmentId}/branding`,
      label: "מיתוג ולוגואים",
      icon: <Image className="h-5 w-5" />,
    },
  ];

  if (isPrimary) {
    items.push({
      href: `/manage/${environmentId}/users`,
      label: "ניהול משתמשי הסביבה",
      icon: <Users className="h-5 w-5" />,
    });
  }

  if (multiEnvironment) {
    items.unshift({
      href: "/manage",
      label: "הסביבות שלי",
      icon: <Building2 className="h-5 w-5" />,
    });
  }

  if (includeAdminLink) {
    items.push({
      href: "/admin",
      label: "הקמת סביבה / כל הסביבות",
      icon: <Settings2 className="h-5 w-5" />,
    });
  }

  return items;
}
