import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  environmentManagers,
  environments,
  questionnaires,
  submissions,
  users,
} from "@/lib/db/schema";
import {
  mapEnvironment,
  mapEnvironmentManager,
  mapQuestionnaire,
  mapSubmission,
  mapUser,
} from "@/lib/db/mappers";
import type {
  Environment,
  EnvironmentManager,
  Questionnaire,
  Submission,
  User,
} from "@/lib/domain/types";
import type {
  IEnvironmentManagerRepository,
  IEnvironmentRepository,
  IQuestionnaireRepository,
  ISubmissionRepository,
  IUserRepository,
} from "@/lib/repositories/interfaces";

export class PostgresUserRepository implements IUserRepository {
  async findById(id: string): Promise<User | undefined> {
    const rows = await getDb()
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return rows[0] ? mapUser(rows[0]) : undefined;
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const rows = await getDb()
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);
    return rows[0] ? mapUser(rows[0]) : undefined;
  }

  async findAll(): Promise<User[]> {
    const rows = await getDb().select().from(users);
    return rows.map(mapUser);
  }

  async save(user: User): Promise<void> {
    await getDb()
      .insert(users)
      .values({
        id: user.id,
        email: user.email.toLowerCase(),
        passwordHash: user.passwordHash,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: user.email.toLowerCase(),
          passwordHash: user.passwordHash,
          name: user.name,
          role: user.role,
        },
      });
  }
}

export class PostgresEnvironmentRepository implements IEnvironmentRepository {
  async findById(id: string): Promise<Environment | undefined> {
    const rows = await getDb()
      .select()
      .from(environments)
      .where(eq(environments.id, id))
      .limit(1);
    return rows[0] ? mapEnvironment(rows[0]) : undefined;
  }

  async findAll(): Promise<Environment[]> {
    const rows = await getDb().select().from(environments);
    return rows.map(mapEnvironment);
  }

  async save(environment: Environment): Promise<void> {
    await getDb()
      .insert(environments)
      .values({
        id: environment.id,
        name: environment.name,
        description: environment.description,
        logos: environment.logos,
        defaultLogoSize: environment.defaultLogoSize,
        createdAt: environment.createdAt,
      })
      .onConflictDoUpdate({
        target: environments.id,
        set: {
          name: environment.name,
          description: environment.description,
          logos: environment.logos,
          defaultLogoSize: environment.defaultLogoSize,
        },
      });
  }

  async delete(id: string): Promise<void> {
    await getDb().delete(environments).where(eq(environments.id, id));
  }
}

export class PostgresEnvironmentManagerRepository
  implements IEnvironmentManagerRepository
{
  async findByEnvironment(environmentId: string): Promise<EnvironmentManager[]> {
    const rows = await getDb()
      .select()
      .from(environmentManagers)
      .where(eq(environmentManagers.environmentId, environmentId));
    return rows.map(mapEnvironmentManager);
  }

  async findByUser(userId: string): Promise<EnvironmentManager[]> {
    const rows = await getDb()
      .select()
      .from(environmentManagers)
      .where(eq(environmentManagers.userId, userId));
    return rows.map(mapEnvironmentManager);
  }

  async find(
    environmentId: string,
    userId: string
  ): Promise<EnvironmentManager | undefined> {
    const rows = await getDb()
      .select()
      .from(environmentManagers)
      .where(
        and(
          eq(environmentManagers.environmentId, environmentId),
          eq(environmentManagers.userId, userId)
        )
      )
      .limit(1);
    return rows[0] ? mapEnvironmentManager(rows[0]) : undefined;
  }

  async save(record: EnvironmentManager): Promise<void> {
    await getDb()
      .insert(environmentManagers)
      .values({
        id: record.id,
        environmentId: record.environmentId,
        userId: record.userId,
        isPrimary: record.isPrimary,
      })
      .onConflictDoUpdate({
        target: environmentManagers.id,
        set: {
          environmentId: record.environmentId,
          userId: record.userId,
          isPrimary: record.isPrimary,
        },
      });
  }

  async delete(id: string): Promise<void> {
    await getDb()
      .delete(environmentManagers)
      .where(eq(environmentManagers.id, id));
  }
}

export class PostgresQuestionnaireRepository implements IQuestionnaireRepository {
  async findById(id: string): Promise<Questionnaire | undefined> {
    const rows = await getDb()
      .select()
      .from(questionnaires)
      .where(eq(questionnaires.id, id))
      .limit(1);
    return rows[0] ? mapQuestionnaire(rows[0]) : undefined;
  }

  async findBySlug(slug: string): Promise<Questionnaire | undefined> {
    const rows = await getDb()
      .select()
      .from(questionnaires)
      .where(eq(questionnaires.slug, slug))
      .limit(1);
    return rows[0] ? mapQuestionnaire(rows[0]) : undefined;
  }

  async findByEnvironment(environmentId: string): Promise<Questionnaire[]> {
    const rows = await getDb()
      .select()
      .from(questionnaires)
      .where(eq(questionnaires.environmentId, environmentId))
      .orderBy(desc(questionnaires.updatedAt));
    return rows.map(mapQuestionnaire);
  }

  async save(questionnaire: Questionnaire): Promise<void> {
    await getDb()
      .insert(questionnaires)
      .values({
        id: questionnaire.id,
        environmentId: questionnaire.environmentId,
        title: questionnaire.title,
        description: questionnaire.description,
        slug: questionnaire.slug,
        isDraft: questionnaire.isDraft,
        isActive: questionnaire.isActive,
        closesAt: questionnaire.closesAt,
        thankYouMessage: questionnaire.thankYouMessage,
        sections: questionnaire.sections,
        questions: questionnaire.questions,
        logoSettings: questionnaire.logoSettings,
        respondentAllowlist: questionnaire.respondentAllowlist,
        createdById: questionnaire.createdById,
        createdAt: questionnaire.createdAt,
        updatedAt: questionnaire.updatedAt,
      })
      .onConflictDoUpdate({
        target: questionnaires.id,
        set: {
          title: questionnaire.title,
          description: questionnaire.description,
          slug: questionnaire.slug,
          isDraft: questionnaire.isDraft,
          isActive: questionnaire.isActive,
          closesAt: questionnaire.closesAt,
          thankYouMessage: questionnaire.thankYouMessage,
          sections: questionnaire.sections,
          questions: questionnaire.questions,
          logoSettings: questionnaire.logoSettings,
          respondentAllowlist: questionnaire.respondentAllowlist,
          updatedAt: questionnaire.updatedAt,
        },
      });
  }

  async delete(id: string): Promise<void> {
    await getDb().delete(questionnaires).where(eq(questionnaires.id, id));
  }
}

export class PostgresSubmissionRepository implements ISubmissionRepository {
  async findById(id: string): Promise<Submission | undefined> {
    const rows = await getDb()
      .select()
      .from(submissions)
      .where(eq(submissions.id, id))
      .limit(1);
    return rows[0] ? mapSubmission(rows[0]) : undefined;
  }

  async findByQuestionnaire(questionnaireId: string): Promise<Submission[]> {
    const rows = await getDb()
      .select()
      .from(submissions)
      .where(eq(submissions.questionnaireId, questionnaireId))
      .orderBy(desc(submissions.submittedAt));
    return rows.map(mapSubmission);
  }

  async findByRespondent(
    questionnaireId: string,
    nationalId?: string,
    phone?: string
  ): Promise<Submission[]> {
    const conditions = [eq(submissions.questionnaireId, questionnaireId)];
    if (nationalId) conditions.push(eq(submissions.nationalId, nationalId));
    if (phone) conditions.push(eq(submissions.phone, phone));

    const rows = await getDb()
      .select()
      .from(submissions)
      .where(and(...conditions))
      .orderBy(desc(submissions.submittedAt));
    return rows.map(mapSubmission);
  }

  async save(submission: Submission): Promise<void> {
    await getDb().insert(submissions).values({
      id: submission.id,
      questionnaireId: submission.questionnaireId,
      nationalId: submission.nationalId,
      phone: submission.phone,
      answers: submission.answers,
      submittedAt: submission.submittedAt,
    });
  }
}
