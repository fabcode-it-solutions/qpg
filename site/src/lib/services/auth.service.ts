import bcrypt from "bcryptjs";
import crypto from "crypto";
import { db } from "@/db";
import {
  users,
  accounts,
  verificationTokens,
  passwordResetTokens,
  userProfiles,
  userSecuritySettings,
  loginAttempts,
  type User,
  type LoginAttempt,
  type NewLoginAttempt,
} from "@/db/schema/auth";
import { eq, and, gte, desc } from "drizzle-orm";
import { AppError } from "@/lib/utils/errors";
import {
  RegisterUserData,
  LoginCredentials,
  PasswordResetData,
  ResetPasswordData,
  SocialUserData,
} from "@/types/auth";
import { EmailService } from "./email.service";

/**
 * Authentication Service Class
 * Handles all authentication-related operations with professional security practices
 */
export class AuthService {
  // Password requirements
  private static readonly PASSWORD_MIN_LENGTH = 8;
  private static readonly PASSWORD_HASH_ROUNDS = 12;

  // Security limits
  private static readonly MAX_LOGIN_ATTEMPTS = 5;
  private static readonly LOCKOUT_DURATION_MINUTES = 15;
  private static readonly PASSWORD_RESET_EXPIRY_HOURS = 1;
  private static readonly EMAIL_VERIFICATION_EXPIRY_HOURS = 24;

  /**
   * Register a new user with credentials
   */
  static async registerUser(userData: RegisterUserData): Promise<User> {
    try {
      // Check if user already exists
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, userData.email.toLowerCase()),
      });

      if (existingUser) {
        throw new AppError("Email already registered", 409);
      }

      // Validate password strength
      this.validatePassword(userData.password);

      // Hash password
      const hashedPassword = await bcrypt.hash(
        userData.password,
        this.PASSWORD_HASH_ROUNDS
      );

      // Create user
      const [newUser] = await db
        .insert(users)
        .values({
          name: userData.name,
          email: userData.email.toLowerCase(),
          password: hashedPassword,
          isEmailVerified: false, // Require email verification
          role: "user",
          isActive: true,
        })
        .returning();

      // Create user profile
      await db.insert(userProfiles).values({
        userId: newUser.id,
        marketingEmails: userData.marketingEmails || false,
      });

      // Create user security settings
      await db.insert(userSecuritySettings).values({
        userId: newUser.id,
      });

      // Create verification token for later use (not sent automatically)
      // User can request verification from their profile
      await this.createEmailVerificationToken(newUser.email);

      return newUser;
    } catch (error) {
      console.error("Registration error:", error);
      if (error instanceof AppError) throw error;
      throw new AppError("Registration failed", 500);
    }
  }

  /**
   * Authenticate user with email and password
   */
  static async authenticateUser(
    credentials: LoginCredentials
  ): Promise<User | null> {
    try {
      const { email, password, ipAddress, userAgent } = credentials;

      // Find user by email
      const user = await db.query.users.findFirst({
        where: eq(users.email, email.toLowerCase()),
      });

      // Log login attempt
      const loginAttempt: NewLoginAttempt = {
        identifier: email.toLowerCase(),
        ipAddress: ipAddress || "unknown",
        userAgent,
        success: false,
        provider: "credentials",
      };

      if (!user) {
        loginAttempt.failureReason = "user_not_found";
        await db.insert(loginAttempts).values(loginAttempt);
        return null;
      }

      // Check if account is active
      if (!user.isActive) {
        loginAttempt.failureReason = "account_inactive";
        await db.insert(loginAttempts).values(loginAttempt);
        throw new AppError("Account is deactivated", 403);
      }

      // Check if account is locked
      if (user.lockedUntil && user.lockedUntil > new Date()) {
        loginAttempt.failureReason = "account_locked";
        await db.insert(loginAttempts).values(loginAttempt);
        throw new AppError(
          "Account is temporarily locked due to too many failed attempts",
          423
        );
      }

      // Note: Email verification is optional - users can verify later from profile

      // Verify password
      if (!user.password || !(await bcrypt.compare(password, user.password))) {
        loginAttempt.failureReason = "invalid_password";
        await db.insert(loginAttempts).values(loginAttempt);

        // Increment failed login attempts
        await this.handleFailedLogin(user.id);
        return null;
      }

      // Successful login
      loginAttempt.success = true;
      delete loginAttempt.failureReason;
      await db.insert(loginAttempts).values(loginAttempt);

      // Reset login attempts and update last login
      await db
        .update(users)
        .set({
          loginAttempts: 0,
          lockedUntil: null,
          lastLoginAt: new Date(),
        })
        .where(eq(users.id, user.id));

      return user;
    } catch (error) {
      console.error("Authentication error:", error);
      if (error instanceof AppError) throw error;
      throw new AppError("Authentication failed", 500);
    }
  }

  /**
   * Create user from social authentication
   */
  static async createFromSocial(socialData: SocialUserData): Promise<User> {
    try {
      // Check if user exists with this email
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, socialData.email.toLowerCase()),
      });

      if (existingUser) {
        // User exists, just return them (NextAuth will handle account linking)
        return existingUser;
      }

      // Create new user from social login
      const [newUser] = await db
        .insert(users)
        .values({
          name: socialData.name,
          email: socialData.email.toLowerCase(),
          image: socialData.image,
          emailVerified: new Date(), // Social accounts are pre-verified
          password: null, // No password for social accounts
          isEmailVerified: true,
          role: "user",
          isActive: true,
        })
        .returning();

      // Create user profile
      await db.insert(userProfiles).values({
        userId: newUser.id,
        marketingEmails: false, // Default to false for social signups
      });

      // Create user security settings
      await db.insert(userSecuritySettings).values({
        userId: newUser.id,
      });

      return newUser;
    } catch (error) {
      console.error("Social user creation error:", error);
      throw new AppError("Failed to create user from social login", 500);
    }
  }

  /**
   * Initiate password reset process with enhanced security
   */
  static async initiatePasswordReset(
    resetData: PasswordResetData
  ): Promise<boolean> {
    try {
      const { email, ipAddress, userAgent } = resetData;
      const normalizedEmail = email.toLowerCase().trim();

      // Rate limiting: Check recent password reset attempts from this IP
      await this.checkPasswordResetRateLimit(ipAddress || "unknown");

      // Find user by email
      const user = await db.query.users.findFirst({
        where: eq(users.email, normalizedEmail),
      });

      // Check if user exists
      if (!user) {
        console.log(
          `Password reset attempted for non-existent email: ${normalizedEmail}`
        );
        throw new AppError("No account found with this email address", 404);
      }

      if (!user.isActive) {
        console.log(
          `Password reset attempted for inactive account: ${normalizedEmail}`
        );
        throw new AppError(
          "Account is deactivated. Please contact support.",
          403
        );
      }

      // Check if user has credentials authentication (not just social login)
      if (!user.password) {
        console.log(
          `Password reset attempted for social-only account: ${normalizedEmail}`
        );
        throw new AppError(
          "This account uses social login. Please sign in with your social provider.",
          400
        );
      }

      // Check for recent password reset attempts for this user
      const recentResetAttempts = await db.query.passwordResetTokens.findMany({
        where: and(
          eq(passwordResetTokens.userId, user.id),
          gte(
            passwordResetTokens.createdAt,
            new Date(Date.now() - 15 * 60 * 1000)
          ) // Last 15 minutes
        ),
      });

      if (recentResetAttempts.length >= 3) {
        console.log(
          `Too many password reset attempts for user: ${normalizedEmail}`
        );
        // Don't reveal rate limiting - return success but don't send email
        return true;
      }

      // Invalidate existing unused password reset tokens
      await db
        .update(passwordResetTokens)
        .set({ used: true })
        .where(
          and(
            eq(passwordResetTokens.userId, user.id),
            eq(passwordResetTokens.used, false)
          )
        );

      // Generate secure reset token
      const resetToken = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date();
      expiresAt.setHours(
        expiresAt.getHours() + this.PASSWORD_RESET_EXPIRY_HOURS
      );

      // Save reset token
      await db.insert(passwordResetTokens).values({
        userId: user.id,
        token: resetToken,
        expires: expiresAt,
        ipAddress,
        userAgent,
      });

      // Send password reset email ONLY to existing, active users with credentials
      const emailSent = await EmailService.sendPasswordResetEmail(
        normalizedEmail,
        resetToken
      );

      if (emailSent) {
        console.log(
          `Password reset email sent successfully to: ${normalizedEmail}`
        );
      } else {
        console.error(
          `Failed to send password reset email to: ${normalizedEmail}`
        );
      }

      return true;
    } catch (error) {
      console.error("Password reset initiation error:", error);
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to initiate password reset", 500);
    }
  }

  /**
   * Check password reset rate limiting by IP address
   */
  private static async checkPasswordResetRateLimit(
    ipAddress: string
  ): Promise<void> {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    // Count password reset attempts from this IP in the last 15 minutes
    const recentAttempts = await db.query.passwordResetTokens.findMany({
      where: and(
        eq(passwordResetTokens.ipAddress, ipAddress),
        gte(passwordResetTokens.createdAt, fifteenMinutesAgo)
      ),
    });

    // Allow maximum 5 attempts per IP per 15 minutes
    if (recentAttempts.length >= 5) {
      throw new AppError(
        "Too many password reset attempts. Please try again later.",
        429
      );
    }
  }

  /**
   * Reset password using token
   */
  static async resetPassword(resetData: ResetPasswordData): Promise<boolean> {
    try {
      const { token, password } = resetData;

      // Validate new password
      this.validatePassword(password);

      // Find valid reset token
      const resetTokenRecord = await db.query.passwordResetTokens.findFirst({
        where: and(
          eq(passwordResetTokens.token, token),
          eq(passwordResetTokens.used, false),
          gte(passwordResetTokens.expires, new Date())
        ),
        with: {
          user: true,
        },
      });

      if (!resetTokenRecord || !resetTokenRecord.user) {
        throw new AppError("Invalid or expired reset token", 400);
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(
        password,
        this.PASSWORD_HASH_ROUNDS
      );

      // Update user password
      await db
        .update(users)
        .set({
          password: hashedPassword,
          loginAttempts: 0,
          lockedUntil: null,
        })
        .where(eq(users.id, resetTokenRecord.userId));

      // Mark token as used
      await db
        .update(passwordResetTokens)
        .set({
          used: true,
          usedAt: new Date(),
        })
        .where(eq(passwordResetTokens.id, resetTokenRecord.id));

      // Update security settings
      await db
        .update(userSecuritySettings)
        .set({
          passwordChangedAt: new Date(),
          lastPasswordReset: new Date(),
        })
        .where(eq(userSecuritySettings.userId, resetTokenRecord.userId));

      return true;
    } catch (error) {
      console.error("Password reset error:", error);
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to reset password", 500);
    }
  }

  /**
   * Create email verification token (without sending email)
   */
  private static async createEmailVerificationToken(
    email: string
  ): Promise<string> {
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setHours(
      expiresAt.getHours() + this.EMAIL_VERIFICATION_EXPIRY_HOURS
    );

    await db.insert(verificationTokens).values({
      identifier: email.toLowerCase(),
      token,
      expires: expiresAt,
      type: "email_verification",
      used: false,
    });

    return token;
  }

  /**
   * Send verification email for existing user
   */
  static async sendVerificationEmail(email: string): Promise<boolean> {
    try {
      // Find user by email
      const user = await db.query.users.findFirst({
        where: eq(users.email, email.toLowerCase()),
      });

      if (!user) {
        throw new AppError("User not found", 404);
      }

      if (user.isEmailVerified) {
        throw new AppError("Email is already verified", 400);
      }

      // Invalidate existing verification tokens
      await db
        .update(verificationTokens)
        .set({ used: true })
        .where(
          and(
            eq(verificationTokens.identifier, email.toLowerCase()),
            eq(verificationTokens.type, "email_verification"),
            eq(verificationTokens.used, false)
          )
        );

      // Create new verification token
      const token = await this.createEmailVerificationToken(email);

      // Send verification email
      await EmailService.sendVerificationEmail(email, token);

      return true;
    } catch (error) {
      console.error("Send verification email error:", error);
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to send verification email", 500);
    }
  }

  /**
   * Handle failed login attempts
   */
  private static async handleFailedLogin(userId: string): Promise<void> {
    // Get current user data
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) return;

    const newAttemptCount = user.loginAttempts + 1;

    // Check if should lock account
    if (newAttemptCount >= this.MAX_LOGIN_ATTEMPTS) {
      const lockUntil = new Date();
      lockUntil.setMinutes(
        lockUntil.getMinutes() + this.LOCKOUT_DURATION_MINUTES
      );

      await db
        .update(users)
        .set({
          loginAttempts: newAttemptCount,
          lockedUntil: lockUntil,
        })
        .where(eq(users.id, userId));
    } else {
      await db
        .update(users)
        .set({
          loginAttempts: newAttemptCount,
        })
        .where(eq(users.id, userId));
    }
  }

  /**
   * Validate password strength
   */
  private static validatePassword(password: string): void {
    if (password.length < this.PASSWORD_MIN_LENGTH) {
      throw new AppError(
        `Password must be at least ${this.PASSWORD_MIN_LENGTH} characters long`,
        400
      );
    }

    // Additional password strength checks
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    // Could add special character check: /[!@#$%^&*(),.?":{}|<>]/.test(password)

    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      throw new AppError(
        "Password must contain uppercase letters, lowercase letters, and numbers",
        400
      );
    }
  }

  /**
   * Get recent login attempts for monitoring
   */
  static async getRecentLoginAttempts(
    identifier: string,
    hours: number = 24
  ): Promise<LoginAttempt[]> {
    const since = new Date();
    since.setHours(since.getHours() - hours);

    return await db.query.loginAttempts.findMany({
      where: and(
        eq(loginAttempts.identifier, identifier.toLowerCase()),
        gte(loginAttempts.attemptedAt, since)
      ),
      orderBy: [desc(loginAttempts.attemptedAt)],
      limit: 10,
    });
  }

  /**
   * Get password reset statistics for monitoring
   */
  static async getPasswordResetStats(hours: number = 24): Promise<{
    totalAttempts: number;
    successfulResets: number;
    topIpAddresses: Array<{ ip: string; count: number }>;
  }> {
    const since = new Date();
    since.setHours(since.getHours() - hours);

    const attempts = await db.query.passwordResetTokens.findMany({
      where: gte(passwordResetTokens.createdAt, since),
    });

    const successful = attempts.filter((attempt) => attempt.used);

    // Count attempts by IP
    const ipCounts = attempts.reduce((acc, attempt) => {
      const ip = attempt.ipAddress || "unknown";
      acc[ip] = (acc[ip] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topIpAddresses = Object.entries(ipCounts)
      .map(([ip, count]) => ({ ip, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalAttempts: attempts.length,
      successfulResets: successful.length,
      topIpAddresses,
    };
  }

  /**
   * Check if password reset token is valid
   */
  static async validatePasswordResetToken(token: string): Promise<boolean> {
    const tokenRecord = await db.query.passwordResetTokens.findFirst({
      where: and(
        eq(passwordResetTokens.token, token),
        eq(passwordResetTokens.used, false),
        gte(passwordResetTokens.expires, new Date())
      ),
    });

    return !!tokenRecord;
  }

  /**
   * Verify email using verification token
   */
  static async verifyEmail(token: string): Promise<boolean> {
    try {
      const verificationRecord = await db.query.verificationTokens.findFirst({
        where: and(
          eq(verificationTokens.token, token),
          eq(verificationTokens.used, false),
          eq(verificationTokens.type, "email_verification"),
          gte(verificationTokens.expires, new Date())
        ),
      });

      if (!verificationRecord) {
        return false;
      }

      // Update user as verified
      await db
        .update(users)
        .set({
          emailVerified: new Date(),
          isEmailVerified: true,
        })
        .where(eq(users.email, verificationRecord.identifier));

      // Mark token as used
      await db
        .update(verificationTokens)
        .set({ used: true })
        .where(eq(verificationTokens.token, verificationRecord.token));

      return true;
    } catch (error) {
      console.error("Email verification error:", error);
      return false;
    }
  }
  /**
   * Find user by email (utility method)
   */
  static async findByEmail(email: string): Promise<User | null> {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.email, email.toLowerCase()),
      });
      return user || null;
    } catch (error) {
      console.error("Error finding user by email:", error);
      return null;
    }
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId: string): Promise<User | null> {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });
      return user || null;
    } catch (error) {
      console.error("Error getting user by ID:", error);
      throw new AppError("Database error while finding user", 500);
    }
  }

  /**
   * Update user data
   */
  static async updateUser(
    userId: string,
    userData: Partial<User>
  ): Promise<User> {
    try {
      const [updatedUser] = await db
        .update(users)
        .set({
          ...userData,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning();

      if (!updatedUser) {
        throw new AppError("User not found", 404);
      }

      return updatedUser;
    } catch (error) {
      console.error("Error updating user:", error);
      throw new AppError("Database error while updating user", 500);
    }
  }

  /**
   * Verify password for password change
   */
  static async verifyPassword(
    email: string,
    password: string
  ): Promise<boolean> {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.email, email.toLowerCase()),
      });

      if (!user?.password) {
        return false;
      }

      return await bcrypt.compare(password, user.password);
    } catch (error) {
      console.error("Password verification error:", error);
      return false;
    }
  }

  /**
   * Check for account conflicts (OAuth vs credentials)
   */
  static async checkAccountConflict(email: string): Promise<{
    email: string;
    existingProvider: string;
    hasPassword: boolean;
  } | null> {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.email, email.toLowerCase()),
        with: {
          accounts: {
            columns: {
              provider: true,
              type: true
            }
          }
        }
      });

      if (!user) return null;

      const oauthAccount = user.accounts.find(acc => acc.type === 'oauth');
      const hasPassword = user.password !== null;

      if (oauthAccount) {
        return {
          email,
          existingProvider: oauthAccount.provider,
          hasPassword
        };
      }

      return null;
    } catch (error) {
      console.error("Account conflict check error:", error);
      return null;
    }
  }

  /**
   * Check if account can be linked with provider
   */
  static async canLinkAccount(email: string, provider: string): Promise<boolean> {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.email, email.toLowerCase()),
        with: {
          accounts: {
            where: eq(accounts.provider, provider)
          }
        }
      });

      // User doesn't exist or already has this provider linked
      return !user || user.accounts.length > 0;
    } catch (error) {
      console.error("Account linking check error:", error);
      return false;
    }
  }

  /**
   * Update user password
   */
  static async updatePassword(
    userId: string,
    newPassword: string
  ): Promise<boolean> {
    try {
      // Validate password strength
      this.validatePassword(newPassword);

      // Hash new password
      const hashedPassword = await bcrypt.hash(
        newPassword,
        this.PASSWORD_HASH_ROUNDS
      );

      // Update password in database
      await db
        .update(users)
        .set({
          password: hashedPassword,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      // Update security settings
      await db
        .update(userSecuritySettings)
        .set({
          passwordChangedAt: new Date(),
        })
        .where(eq(userSecuritySettings.userId, userId));

      return true;
    } catch (error) {
      console.error("Password update error:", error);
      return false;
    }
  }
}
