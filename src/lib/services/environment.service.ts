import { v4 as uuidv4 } from "uuid";
import type {
  BrandLogo,
  Environment,
  EnvironmentListItem,
  EnvironmentManager,
  LogoSize,
} from "@/lib/domain/types";
import { DEFAULT_LOGO_SIZE } from "@/lib/brand-logos";
import { repositories } from "@/lib/repositories";
import type { SessionPayload } from "@/lib/auth/session";

export class EnvironmentService {
  async getAccessibleEnvironmentList(
    session: SessionPayload
  ): Promise<EnvironmentListItem[]> {
    if (session.role === "ADMIN") {
      return repositories.environments.findAllListItems();
    }
    const links = await repositories.environmentManagers.findByUser(
      session.userId
    );
    const items = await Promise.all(
      links.map(async (link) => {
        const environment = await repositories.environments.findById(
          link.environmentId
        );
        if (!environment) return undefined;
        return {
          id: environment.id,
          name: environment.name,
          description: environment.description,
          defaultLogoSize: environment.defaultLogoSize,
          createdAt: environment.createdAt,
          logoCount: environment.logos.length,
        } satisfies EnvironmentListItem;
      })
    );
    return items.filter((item): item is EnvironmentListItem => Boolean(item));
  }

  async getAccessibleEnvironment(
    session: SessionPayload,
    environmentId: string
  ): Promise<Environment | undefined> {
    const canAccess = await this.canAccess(session, environmentId);
    if (!canAccess) return undefined;
    return repositories.environments.findById(environmentId);
  }

  async getAccessibleEnvironments(
    session: SessionPayload
  ): Promise<Environment[]> {
    if (session.role === "ADMIN") {
      return repositories.environments.findAll();
    }
    const links = await repositories.environmentManagers.findByUser(
      session.userId
    );
    const environments = await Promise.all(
      links.map((l) => repositories.environments.findById(l.environmentId))
    );
    return environments.filter((e): e is Environment => Boolean(e));
  }

  async canAccess(
    session: SessionPayload,
    environmentId: string
  ): Promise<boolean> {
    if (session.role === "ADMIN") return true;
    const link = await repositories.environmentManagers.find(
      environmentId,
      session.userId
    );
    return Boolean(link);
  }

  async isPrimaryManager(
    userId: string,
    environmentId: string
  ): Promise<boolean> {
    const link = await repositories.environmentManagers.find(
      environmentId,
      userId
    );
    return link?.isPrimary ?? false;
  }

  async createEnvironment(
    name: string,
    description: string
  ): Promise<EnvironmentListItem> {
    const environment: Environment = {
      id: uuidv4(),
      name,
      description,
      logos: [],
      defaultLogoSize: DEFAULT_LOGO_SIZE,
      createdAt: new Date().toISOString(),
    };
    await repositories.environments.save(environment);
    return {
      id: environment.id,
      name: environment.name,
      description: environment.description,
      defaultLogoSize: environment.defaultLogoSize,
      createdAt: environment.createdAt,
      logoCount: 0,
    };
  }

  async updateEnvironment(
    id: string,
    name: string,
    description: string
  ): Promise<Environment> {
    const existing = await repositories.environments.findById(id);
    if (!existing) throw new Error("סביבה לא נמצאה");
    const updated = { ...existing, name, description };
    await repositories.environments.save(updated);
    return updated;
  }

  async deleteEnvironment(id: string): Promise<void> {
    await repositories.environments.delete(id);
  }

  async getManagers(environmentId: string): Promise<
    Array<{
      link: EnvironmentManager;
      userName: string;
      userEmail: string;
    }>
  > {
    const links =
      await repositories.environmentManagers.findByEnvironment(environmentId);
    return Promise.all(
      links.map(async (link) => {
        const user = await repositories.users.findById(link.userId);
        return {
          link,
          userName: user?.name ?? "—",
          userEmail: user?.email ?? "—",
        };
      })
    );
  }

  async addManager(
    environmentId: string,
    userId: string,
    isPrimary = false
  ): Promise<EnvironmentManager> {
    const existing = await repositories.environmentManagers.find(
      environmentId,
      userId
    );
    if (existing) throw new Error("המשתמש כבר משויך לסביבה");

    const record: EnvironmentManager = {
      id: uuidv4(),
      environmentId,
      userId,
      isPrimary,
    };
    await repositories.environmentManagers.save(record);
    return record;
  }

  async removeManager(linkId: string): Promise<void> {
    await repositories.environmentManagers.delete(linkId);
  }

  async updateBranding(
    id: string,
    logos: BrandLogo[],
    defaultLogoSize: LogoSize
  ): Promise<Environment> {
    const existing = await repositories.environments.findById(id);
    if (!existing) throw new Error("סביבה לא נמצאה");
    const updated = {
      ...existing,
      logos: logos.map((l, i) => ({ ...l, order: i })),
      defaultLogoSize,
    };
    await repositories.environments.save(updated);
    return updated;
  }
}

export const environmentService = new EnvironmentService();
