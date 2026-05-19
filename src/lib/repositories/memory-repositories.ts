import type {
  Environment,
  EnvironmentListItem,
  EnvironmentManager,
  Questionnaire,
  Submission,
  User,
} from "@/lib/domain/types";
import { getStore } from "@/lib/repositories/memory-store";
import type {
  IEnvironmentManagerRepository,
  IEnvironmentRepository,
  IQuestionnaireRepository,
  ISubmissionRepository,
  IUserRepository,
} from "@/lib/repositories/interfaces";

class MemoryUserRepository implements IUserRepository {
  async findById(id: string) {
    return getStore().users.find((u) => u.id === id);
  }

  async findByEmail(email: string) {
    return getStore().users.find((u) => u.email === email.toLowerCase());
  }

  async findAll() {
    return [...getStore().users];
  }

  async save(user: User) {
    const store = getStore();
    const index = store.users.findIndex((u) => u.id === user.id);
    if (index >= 0) store.users[index] = user;
    else store.users.push(user);
  }
}

class MemoryEnvironmentRepository implements IEnvironmentRepository {
  async findById(id: string) {
    return getStore().environments.find((e) => e.id === id);
  }

  async findAll() {
    return [...getStore().environments];
  }

  async findAllListItems(): Promise<EnvironmentListItem[]> {
    return getStore().environments.map((environment) => ({
      id: environment.id,
      name: environment.name,
      description: environment.description,
      defaultLogoSize: environment.defaultLogoSize,
      createdAt: environment.createdAt,
      logoCount: environment.logos.length,
    }));
  }

  async save(environment: Environment) {
    const store = getStore();
    const index = store.environments.findIndex((e) => e.id === environment.id);
    if (index >= 0) store.environments[index] = environment;
    else store.environments.push(environment);
  }

  async delete(id: string) {
    const store = getStore();
    store.environments = store.environments.filter((e) => e.id !== id);
    store.environmentManagers = store.environmentManagers.filter(
      (m) => m.environmentId !== id
    );
    const qIds = store.questionnaires
      .filter((q) => q.environmentId === id)
      .map((q) => q.id);
    store.questionnaires = store.questionnaires.filter(
      (q) => q.environmentId !== id
    );
    store.submissions = store.submissions.filter(
      (s) => !qIds.includes(s.questionnaireId)
    );
  }
}

class MemoryEnvironmentManagerRepository implements IEnvironmentManagerRepository {
  async findByEnvironment(environmentId: string) {
    return getStore().environmentManagers.filter(
      (m) => m.environmentId === environmentId
    );
  }

  async findByUser(userId: string) {
    return getStore().environmentManagers.filter((m) => m.userId === userId);
  }

  async find(environmentId: string, userId: string) {
    return getStore().environmentManagers.find(
      (m) => m.environmentId === environmentId && m.userId === userId
    );
  }

  async save(record: EnvironmentManager) {
    const store = getStore();
    const index = store.environmentManagers.findIndex((m) => m.id === record.id);
    if (index >= 0) store.environmentManagers[index] = record;
    else store.environmentManagers.push(record);
  }

  async delete(id: string) {
    getStore().environmentManagers = getStore().environmentManagers.filter(
      (m) => m.id !== id
    );
  }
}

class MemoryQuestionnaireRepository implements IQuestionnaireRepository {
  async findById(id: string) {
    return getStore().questionnaires.find((q) => q.id === id);
  }

  async findBySlug(slug: string) {
    return getStore().questionnaires.find((q) => q.slug === slug);
  }

  async findByEnvironment(environmentId: string) {
    return getStore()
      .questionnaires.filter((q) => q.environmentId === environmentId)
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
  }

  async save(questionnaire: Questionnaire) {
    const store = getStore();
    const index = store.questionnaires.findIndex((q) => q.id === questionnaire.id);
    if (index >= 0) store.questionnaires[index] = questionnaire;
    else store.questionnaires.push(questionnaire);
  }

  async delete(id: string) {
    const store = getStore();
    store.questionnaires = store.questionnaires.filter((q) => q.id !== id);
    store.submissions = store.submissions.filter((s) => s.questionnaireId !== id);
  }
}

class MemorySubmissionRepository implements ISubmissionRepository {
  async findById(id: string) {
    return getStore().submissions.find((s) => s.id === id);
  }

  async findByQuestionnaire(questionnaireId: string) {
    return getStore()
      .submissions.filter((s) => s.questionnaireId === questionnaireId)
      .sort(
        (a, b) =>
          new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      );
  }

  async findByRespondent(
    questionnaireId: string,
    nationalId?: string,
    phone?: string
  ) {
    const list = await this.findByQuestionnaire(questionnaireId);
    return list.filter((s) => {
      if (nationalId && s.nationalId !== nationalId) return false;
      if (phone && s.phone !== phone) return false;
      return true;
    });
  }

  async save(submission: Submission) {
    const store = getStore();
    if (submission.isPreview) {
      store.submissions = store.submissions.filter(
        (s) =>
          !(
            s.questionnaireId === submission.questionnaireId &&
            s.phone === submission.phone &&
            s.isPreview
          )
      );
    } else {
      const duplicate = store.submissions.some(
        (s) =>
          s.questionnaireId === submission.questionnaireId &&
          s.phone === submission.phone &&
          !s.isPreview
      );
      if (duplicate) {
        throw new Error("DUPLICATE_SUBMISSION");
      }
    }
    store.submissions.push(submission);
  }
}

export const memoryRepositories = {
  users: new MemoryUserRepository(),
  environments: new MemoryEnvironmentRepository(),
  environmentManagers: new MemoryEnvironmentManagerRepository(),
  questionnaires: new MemoryQuestionnaireRepository(),
  submissions: new MemorySubmissionRepository(),
};
