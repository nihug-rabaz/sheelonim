import type {
  Environment,
  EnvironmentManager,
  Questionnaire,
  Submission,
  User,
} from "@/lib/domain/types";

export interface IUserRepository {
  findById(id: string): Promise<User | undefined>;
  findByEmail(email: string): Promise<User | undefined>;
  findAll(): Promise<User[]>;
  save(user: User): Promise<void>;
}

export interface IEnvironmentRepository {
  findById(id: string): Promise<Environment | undefined>;
  findAll(): Promise<Environment[]>;
  save(environment: Environment): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface IEnvironmentManagerRepository {
  findByEnvironment(environmentId: string): Promise<EnvironmentManager[]>;
  findByUser(userId: string): Promise<EnvironmentManager[]>;
  find(
    environmentId: string,
    userId: string
  ): Promise<EnvironmentManager | undefined>;
  save(record: EnvironmentManager): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface IQuestionnaireRepository {
  findById(id: string): Promise<Questionnaire | undefined>;
  findBySlug(slug: string): Promise<Questionnaire | undefined>;
  findByEnvironment(environmentId: string): Promise<Questionnaire[]>;
  save(questionnaire: Questionnaire): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface ISubmissionRepository {
  findById(id: string): Promise<Submission | undefined>;
  findByQuestionnaire(questionnaireId: string): Promise<Submission[]>;
  findByRespondent(
    questionnaireId: string,
    nationalId?: string,
    phone?: string
  ): Promise<Submission[]>;
  save(submission: Submission): Promise<void>;
}
