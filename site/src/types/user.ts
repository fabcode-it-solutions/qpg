export interface User {
  id: string;
  name: string | null;
  email: string;
  emailVerified: Date | null;
  image: string | null;
  password?: string | null;
  stripeCustomerId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUser {
  name: string;
  email: string;
  password: string;
}

export interface UpdateUser {
  name?: string;
  email?: string;
  password?: string;
  image?: string;
  emailVerified?: Date;
  stripeCustomerId?: string;
}