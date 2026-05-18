import { isDatabaseEnabled } from "@/lib/db";
import { memoryRepositories } from "@/lib/repositories/memory-repositories";
import {
  PostgresEnvironmentManagerRepository,
  PostgresEnvironmentRepository,
  PostgresQuestionnaireRepository,
  PostgresSubmissionRepository,
  PostgresUserRepository,
} from "@/lib/repositories/postgres-repositories";

const postgresRepositories = {
  users: new PostgresUserRepository(),
  environments: new PostgresEnvironmentRepository(),
  environmentManagers: new PostgresEnvironmentManagerRepository(),
  questionnaires: new PostgresQuestionnaireRepository(),
  submissions: new PostgresSubmissionRepository(),
};

export const repositories = isDatabaseEnabled()
  ? postgresRepositories
  : memoryRepositories;
