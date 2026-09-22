/**
 * Email Service for sending authentication-related emails
 * Uses Nodemailer with Gmail SMTP for reliable email delivery
 * Falls back to console logging in development
 */

import nodemailer from "nodemailer";
import {
  EmailData,
  PurchaseConfirmationData,
  ContactFormData as EmailContactFormData,
  EmailServiceConfig,
} from "@/types/email";

// Create Gmail SMTP transporter
const createTransporter = () => {
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      service: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: false,
      from: process.env.SMTP_USER,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS, // Gmail App Password, not regular password
      },
    });
  }
  return null;
};

const transporter = createTransporter();

export class EmailService {
  /**
   * Send password reset email
   */
  static async sendPasswordResetEmail(
    email: string,
    resetToken: string
  ): Promise<boolean> {
    const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}`;

    const emailData: EmailData = {
      to: email,
      subject: "Reset Your Password - QPG",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Reset Your Password</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #000; color: #D4AF37; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; }
            .button { 
              display: inline-block; 
              background: #D4AF37; 
              color: #000; 
              text-decoration: none; 
              padding: 12px 30px; 
              border-radius: 5px; 
              font-weight: bold; 
              margin: 20px 0; 
            }
            .footer { background: #333; color: #fff; padding: 20px; text-align: center; font-size: 12px; }
            .warning { 
              background: #fff3cd; 
              border: 1px solid #ffeaa7; 
              padding: 15px; 
              border-radius: 5px; 
              margin: 20px 0; 
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>QPG - Reset Your Password</h1>
            </div>
            <div class="content">
              <h2>Password Reset Request</h2>
              <p>Hello,</p>
              <p>You recently requested to reset your password for your QPG account. Click the button below to reset it:</p>
              
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </div>
              
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; background: #f0f0f0; padding: 10px; border-radius: 3px;">
                ${resetUrl}
              </p>
              
              <div class="warning">
                <strong>Security Note:</strong>
                <ul>
                  <li>This link will expire in 1 hour for security purposes</li>
                  <li>If you didn't request this reset, please ignore this email</li>
                  <li>Never share this link with anyone</li>
                </ul>
              </div>
              
              <p>If you continue to have problems, please contact our support team.</p>
              <p>Best regards,<br>QPG Team</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} QPG. All rights reserved.</p>
              <p>This is an automated message, please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Reset Your Password - QPG

Hello,

You recently requested to reset your password for your QPG account. 

To reset your password, please visit: ${resetUrl}

Security Notes:
- This link will expire in 1 hour for security purposes
- If you didn't request this reset, please ignore this email
- Never share this link with anyone

If you continue to have problems, please contact our support team.

Best regards,
QPG Team

© ${new Date().getFullYear()} QPG. All rights reserved.
This is an automated message, please do not reply to this email.
      `,
    };

    return await this.sendEmail(emailData);
  }

  /**
   * Send email verification email
   */
  static async sendVerificationEmail(
    email: string,
    verificationToken: string
  ): Promise<boolean> {
    const verifyUrl = `${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${verificationToken}`;

    const emailData: EmailData = {
      to: email,
      subject: "Verify Your Email - QPG",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Verify Your Email</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #000; color: #D4AF37; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; }
            .button { 
              display: inline-block; 
              background: #D4AF37; 
              color: #000; 
              text-decoration: none; 
              padding: 12px 30px; 
              border-radius: 5px; 
              font-weight: bold; 
              margin: 20px 0; 
            }
            .footer { background: #333; color: #fff; padding: 20px; text-align: center; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>QPG - Verify Your Email</h1>
            </div>
            <div class="content">
              <h2>Welcome to QPG!</h2>
              <p>Hello,</p>
              <p>Thank you for registering with QPG. To complete your registration, please verify your email address by clicking the button below:</p>
              
              <div style="text-align: center;">
                <a href="${verifyUrl}" class="button">Verify Email</a>
              </div>
              
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; background: #f0f0f0; padding: 10px; border-radius: 3px;">
                ${verifyUrl}
              </p>
              
              <p>This verification link will expire in 24 hours.</p>
              
              <p>If you didn't create an account with QPG, you can safely ignore this email.</p>
              
              <p>Best regards,<br>QPG Team</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} QPG. All rights reserved.</p>
              <p>This is an automated message, please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Verify Your Email - QPG

Hello,

Thank you for registering with QPG. To complete your registration, please verify your email address by visiting: ${verifyUrl}

This verification link will expire in 24 hours.

If you didn't create an account with QPG, you can safely ignore this email.

Best regards,
QPG Team

© ${new Date().getFullYear()} QPG. All rights reserved.
This is an automated message, please do not reply to this email.
      `,
    };

    return await this.sendEmail(emailData);
  }

  /**
   * Send contact form notification email to admin
   */
  static async sendContactFormNotification(
    formData: EmailContactFormData
  ): Promise<boolean> {
    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;

    if (!adminEmail) {
      console.warn("No admin email configured for contact form notifications");
      return false;
    }

    const emailData: EmailData = {
      to: adminEmail,
      subject: `New Contact Form Submission: ${formData.subject}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>New Contact Form Submission</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #000; color: #D4AF37; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; }
            .field { margin-bottom: 15px; }
            .field strong { display: block; margin-bottom: 5px; }
            .footer { background: #333; color: #fff; padding: 20px; text-align: center; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>QPG - New Contact Form Submission</h1>
            </div>
            <div class="content">
              <h2>Contact Form Details</h2>
              
              <div class="field">
                <strong>Name:</strong>
                ${formData.name}
              </div>
              
              <div class="field">
                <strong>Email:</strong>
                ${formData.email}
              </div>
              
              ${
                formData.phone
                  ? `<div class="field">
                <strong>Phone:</strong>
                ${formData.phone}
              </div>`
                  : ""
              }
              
              ${
                formData.businessAddress
                  ? `<div class="field">
                <strong>Business Address:</strong>
                ${formData.businessAddress}
              </div>`
                  : ""
              }
              
              <div class="field">
                <strong>Subject:</strong>
                ${formData.subject}
              </div>
              
              <div class="field">
                <strong>Message:</strong>
                <div style="background: #f0f0f0; padding: 15px; border-radius: 5px; margin-top: 5px;">
                  ${formData.message.replace(/\n/g, "<br>")}
                </div>
              </div>
              
              <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} QPG. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
New Contact Form Submission - QPG

Name: ${formData.name}
Email: ${formData.email}
${
  formData.phone
    ? `Phone: ${formData.phone}
`
    : ""
}${
        formData.businessAddress
          ? `Business Address: ${formData.businessAddress}
`
          : ""
      }Subject: ${formData.subject}

Message:
${formData.message}

Submitted: ${new Date().toLocaleString()}

© ${new Date().getFullYear()} QPG. All rights reserved.
      `,
    };

    return await this.sendEmail(emailData);
  }

  /**
   * Send contact form confirmation email to user
   */
  static async sendContactFormConfirmation(
    formData: EmailContactFormData
  ): Promise<boolean> {
    const emailData: EmailData = {
      to: formData.email,
      subject: "Thank you for contacting QPG",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Thank you for contacting QPG</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #000; color: #D4AF37; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; }
            .footer { background: #333; color: #fff; padding: 20px; text-align: center; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>QPG - Message Received</h1>
            </div>
            <div class="content">
              <h2>Thank you for contacting us!</h2>
              <p>Hello ${formData.name},</p>
              <p>We have received your message regarding "${
                formData.subject
              }" and will get back to you as soon as possible.</p>
              
              <p><strong>Your message:</strong></p>
              <div style="background: #f0f0f0; padding: 15px; border-radius: 5px; margin: 15px 0;">
                ${formData.message.replace(/\n/g, "<br>")}
              </div>
              
              <p>We typically respond within 24 hours during business days.</p>
              
              <p>Best regards,<br>QPG Team</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} QPG. All rights reserved.</p>
              <p>This is an automated message, please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Thank you for contacting QPG

Hello ${formData.name},

We have received your message regarding "${
        formData.subject
      }" and will get back to you as soon as possible.

Your message:
${formData.message}

We typically respond within 24 hours during business days.

Best regards,
QPG Team

© ${new Date().getFullYear()} QPG. All rights reserved.
This is an automated message, please do not reply to this email.
      `,
    };

    return await this.sendEmail(emailData);
  }

  /**
   * Send purchase confirmation email
   */
  static async sendPurchaseConfirmationEmail(
    data: PurchaseConfirmationData
  ): Promise<boolean> {
    const emailData: EmailData = {
      to: data.email,
      subject: "🎉 Welcome to QPG - Purchase Confirmation",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Purchase Confirmation - QPG</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px; }
            .content { background: #f9f9f9; padding: 25px; border-radius: 8px; margin-bottom: 25px; }
            .next-steps { background: #e8f5e8; padding: 25px; border-radius: 8px; border-left: 4px solid #4CAF50; margin-bottom: 25px; }
            .important { background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin-bottom: 25px; }
            .button { background: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; }
            .footer { border-top: 2px solid #eee; padding-top: 20px; text-align: center; color: #666; }
            table { width: 100%; border-collapse: collapse; }
            td { padding: 8px 0; border-bottom: 1px solid #eee; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">🎉 Welcome to QPG!</h1>
              
              <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your purchase was successful</p>
            </div>

            <div class="content">
              <h2 style="color: #2c5530; margin-top: 0;">Purchase Details</h2>
              <table>
                <tr>
                  <td><strong>Customer:</strong></td>
                  <td>${data.customerName}</td>
                </tr>
                <tr>
                  <td><strong>Course:</strong></td>
                  <td>Premium Course Access</td>
                </tr>
                <tr>
                  <td><strong>Amount:</strong></td>
                  <td>$${(data.amount / 100).toFixed(2)}/year</td>
                </tr>
                <tr>
                  <td><strong>Transaction ID:</strong></td>
                  <td>${data.transactionId}</td>
                </tr>
                   </table>
            </div>

            <div class="next-steps">
              <h3 style="color: #2c5530; margin-top: 0;">🚀 What's Next?</h3>
              <ol style="margin: 0; padding-left: 20px;">
                <li style="margin-bottom: 10px;"><strong>Access Your Course:</strong> Log in to your account to start learning immediately</li>                
                <li style="margin-bottom: 10px;"><strong>Full Access:</strong> Enjoy unlimited access to all course materials and updates</li>
                <li><strong>Support:</strong> Contact us anytime if you need help</li>
              </ol>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXTAUTH_URL}/courses/${
        data.courseId
      }" class="button">
                Access Your Course Now
              </a>
            </div>

            <div class="important">
              <h4 style="color: #856404; margin-top: 0;">📋 Important Information</h4>
              <ul style="margin: 0; padding-left: 20px; color: #856404;">                
                <li>You can cancel anytime from your account settings</li>
                <li>Access remains active until the end of your current billing period</li>
                <li>All course materials are available 24/7</li>
              </ul>
            </div>

            <div class="footer">
              <p><strong>Need Help?</strong></p>
              <p>Contact our support team or visit our help center</p>
              <p style="margin-top: 20px;">
                <a href="${
                  process.env.NEXTAUTH_URL
                }/legal/refund-policy" style="color: #4CAF50; text-decoration: none;">Refund Policy</a> | 
                <a href="${
                  process.env.NEXTAUTH_URL
                }/legal/terms-and-conditions" style="color: #4CAF50; text-decoration: none;">Terms & Conditions</a> | 
                <a href="${
                  process.env.NEXTAUTH_URL
                }/legal/privacy-policy" style="color: #4CAF50; text-decoration: none;">Privacy Policy</a>
              </p>
              <p style="margin-top: 20px; font-size: 14px; color: #999;">
                © ${new Date().getFullYear()} QPG. All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Welcome to QPG - Purchase Confirmation

🎉 Your purchase was successful!

Purchase Details:
- Customer: ${data.customerName}
- Course: Premium Course Access
- Amount: $${(data.amount / 100).toFixed(2)}/year
- Transaction ID: ${data.transactionId}

What's Next?
1. Access Your Course: Log in to your account to start learning immediately
2. Full Access: Enjoy unlimited access to all course materials and updates
3. Support: Contact us anytime if you need help

Access your course: ${process.env.NEXTAUTH_URL}/courses/${data.courseId}

Important Information:
- You can cancel anytime from your account settings
- Access remains active until the end of your current billing period
- All course materials are available 24/7

Need Help? Contact our support team or visit our help center

Refund Policy: ${process.env.NEXTAUTH_URL}/legal/refund-policy
Terms & Conditions: ${process.env.NEXTAUTH_URL}/legal/terms-and-conditions
Privacy Policy: ${process.env.NEXTAUTH_URL}/legal/privacy-policy

© ${new Date().getFullYear()} QPG. All rights reserved.
      `,
    };

    return await this.sendEmail(emailData);
  }

  /**
   * Core email sending method
   * Uses transporter if available, otherwise logs to console
   */
  private static async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      if (transporter) {
        const info = await transporter.sendMail({
          from: process.env.SMTP_USER,
          to: emailData.to,
          subject: emailData.subject,
          html: emailData.html,
          text: emailData.text,
        });

        console.log(`Email sent successfully: ${info.messageId}`);
        return true;
      } else {
        // Development fallback - log to console
        console.log("\n=== EMAIL WOULD BE SENT ===");
        console.log(`To: ${emailData.to}`);
        console.log(`Subject: ${emailData.subject}`);
        console.log(`Text: ${emailData.text}`);
        console.log("============================\n");
        return true;
      }
    } catch (error) {
      console.error("Failed to send email:", error);
      return false;
    }
  }
}
