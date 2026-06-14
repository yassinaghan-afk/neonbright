export type UserRole = "owner" | "staff";

export type AdminUser = {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SessionUser = {
  userId: string;
  email: string;
  role: UserRole;
  name: string;
};
