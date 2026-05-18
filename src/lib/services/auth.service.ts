import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import type { User, UserRole } from "@/lib/domain/types";
import { repositories } from "@/lib/repositories";
import type { SessionPayload } from "@/lib/auth/session";

export class AuthService {
  async login(
    email: string,
    password: string
  ): Promise<SessionPayload | null> {
    const user = await repositories.users.findByEmail(email);
    if (!user) return null;
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return null;
    return this.toSession(user);
  }

  toSession(user: User): SessionPayload {
    return {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }

  async createManagerUser(
    email: string,
    password: string,
    name: string
  ): Promise<User> {
    const existing = await repositories.users.findByEmail(email);
    if (existing) throw new Error("משתמש עם אימייל זה כבר קיים");

    const user: User = {
      id: uuidv4(),
      email: email.toLowerCase(),
      passwordHash: bcrypt.hashSync(password, 10),
      name,
      role: "ENVIRONMENT_MANAGER",
      createdAt: new Date().toISOString(),
    };
    await repositories.users.save(user);
    return user;
  }

  async getUser(id: string): Promise<User | undefined> {
    return repositories.users.findById(id);
  }

  isAdmin(role: UserRole): boolean {
    return role === "ADMIN";
  }
}

export const authService = new AuthService();
