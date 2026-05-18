import bcrypt from "bcryptjs";
import type { DataStore } from "@/lib/domain/types";
import { emptyLogoSettings } from "@/lib/brand-logos";
import { emptyRespondentAllowlist } from "@/lib/respondent-allowlist";
import { DEFAULT_THANK_YOU_MESSAGE } from "@/lib/domain/types";

export function createSeedData(): DataStore {
  const adminId = "user-admin";
  const managerId = "user-manager";
  const envId = "env-demo";
  const questionnaireId = "q-demo";
  const now = new Date().toISOString();

  return {
    users: [
      {
        id: adminId,
        email: "admin@mitav.local",
        passwordHash: bcrypt.hashSync("admin123", 10),
        name: "מנהל מערכת",
        role: "ADMIN",
        createdAt: now,
      },
      {
        id: managerId,
        email: "manager@mitav.local",
        passwordHash: bcrypt.hashSync("manager123", 10),
        name: "מנהל סביבה",
        role: "ENVIRONMENT_MANAGER",
        createdAt: now,
      },
    ],
    environments: [
      {
        id: envId,
        name: "סביבת הדגמה",
        description: "סביבה לדוגמה והתנסות במערכת",
        logos: [],
        defaultLogoSize: "md",
        createdAt: now,
      },
    ],
    environmentManagers: [
      {
        id: "em-demo",
        environmentId: envId,
        userId: managerId,
        isPrimary: true,
      },
    ],
    questionnaires: [
      {
        id: questionnaireId,
        environmentId: envId,
        title: "שאלון שביעות רצון",
        description: "שאלון לדוגמה — ניתן לערוך או למחוק",
        slug: "demo-survey",
        isDraft: false,
        isActive: true,
        closesAt: null,
        thankYouMessage: DEFAULT_THANK_YOU_MESSAGE,
        allowRespondentPdfDownload: true,
        sections: [
          {
            id: "sec-demo",
            title: "פרטים כלליים",
            description: "שאלות על החוויה במערכת",
            order: 0,
          },
        ],
        questions: [
          {
            id: "q1",
            type: "YES_NO",
            title: "האם אתה מרוצה מהשירות?",
            required: true,
            order: 0,
            sectionId: "sec-demo",
          },
          {
            id: "q2",
            type: "MULTIPLE_CHOICE",
            title: "מה הכי אהבת?",
            required: false,
            order: 1,
            sectionId: "sec-demo",
            allowMultiple: true,
            options: [
              { id: "o1", label: "ממשק נוח" },
              { id: "o2", label: "מהירות" },
              { id: "o3", label: "תמיכה" },
              { id: "o4", label: "אחר", allowFreeText: true },
            ],
          },
          {
            id: "q3",
            type: "RATING",
            title: "דרג את החוויה הכוללת",
            required: true,
            order: 2,
            sectionId: "sec-demo",
            minRating: 1,
            maxRating: 5,
          },
          {
            id: "q4",
            type: "TEXT",
            title: "הערות נוספות",
            required: false,
            order: 3,
            sectionId: "sec-demo",
          },
        ],
        logoSettings: emptyLogoSettings(),
        respondentAllowlist: emptyRespondentAllowlist(),
        createdById: managerId,
        createdAt: now,
        updatedAt: now,
      },
    ],
    submissions: [],
  };
}
