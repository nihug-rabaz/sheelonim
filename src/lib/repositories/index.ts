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

type RepositoryBundle = typeof postgresRepositories;

function resolveRepositories(): RepositoryBundle {
  return isDatabaseEnabled() ? postgresRepositories : memoryRepositories;
}

export const repositories: RepositoryBundle = {
  get users() {
    return resolveRepositories().users;
  },
  get environments() {
    return resolveRepositories().environments;
  },
  get environmentManagers() {
    return resolveRepositories().environmentManagers;
  },
  get questionnaires() {
    return resolveRepositories().questionnaires;
  },
  get submissions() {
    return resolveRepositories().submissions;
  },
};
