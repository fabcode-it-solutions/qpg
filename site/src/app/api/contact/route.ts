import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { contactSubmissions } from "@/db/schema";
import { EmailService } from "@/lib/services/email.service";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";

const contactSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .regex(
      /^[a-zA-Z\s\-']+$/,
      "Name can only contain letters, spaces, hyphens, and apostrophes"
    ),
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  phone: z.string().optional(),
  businessAddress: z.string().optional(),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(1, "Message is required"),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = contactSchema.parse(body);

    // Get user session if available
    const session = await getServerSession(authOptions);

    // Get client IP and user agent for tracking
    const ipAddress =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    // Save to database
    const [submission] = await db
      .insert(contactSubmissions)
      .values({
        name: validatedData.name,
        email: validatedData.email,
        phone: validatedData.phone || null,
        businessAddress: validatedData.businessAddress || null,
        subject: validatedData.subject,
        message: validatedData.message,
        userId: session?.user?.id || null,
        ipAddress,
        userAgent,
      })
      .returning();

    // Send notification email to admin
    const adminNotificationSent =
      await EmailService.sendContactFormNotification(validatedData);

    // Send confirmation email to user
    const confirmationSent = await EmailService.sendContactFormConfirmation(validatedData);

    return NextResponse.json(
      {
        success: true,
        message: "Message sent successfully! We'll get back to you soon.",
        submissionId: submission.id,
        emailStatus: {
          adminNotified: adminNotificationSent,
          confirmationSent: confirmationSent,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Contact form submission error:", error);

    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          errors: error.issues.reduce((acc, issue) => {
            if (issue.path[0]) {
              acc[issue.path[0] as string] = issue.message;
            }
            return acc;
          }, {} as Record<string, string>),
        },
        { status: 400 }
      );
    }

    // Handle other errors
    return NextResponse.json(
      {
        success: false,
        message: "Failed to send message. Please try again later.",
      },
      { status: 500 }
    );
  }
}
