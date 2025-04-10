import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { z } from "zod";

// Validation schema for contact form
const contactFormSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  message: z.string().min(10),
});

export async function POST(req: Request) {
  try {
    // Parse request body
    const body = await req.json();
    
    // Validate the request data
    const result = contactFormSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid form data", details: result.error.format() },
        { status: 400 }
      );
    }
    
    const { name, email, message } = result.data;
    
    // In a production environment, you would use real SMTP credentials
    // This is a basic example using a transporter that logs to console
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER || "user",
        pass: process.env.SMTP_PASSWORD || "password",
      },
    });
    
    // Prepare email content
    const mailOptions = {
      from: `"Narravid Contact Form" <${process.env.CONTACT_FROM_EMAIL || "noreply@narravid.io"}>`,
      to: process.env.CONTACT_TO_EMAIL || "contact@narravid.io",
      replyTo: email,
      subject: `Contact Form Submission from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <div style="margin-top: 20px; padding: 15px; background-color: #f5f5f5; border-radius: 5px;">
            <p><strong>Message:</strong></p>
            <p style="white-space: pre-line;">${message}</p>
          </div>
        </div>
      `,
    };
    
    // For development, log instead of sending
    if (process.env.NODE_ENV === "development") {
      console.log("Email would be sent:", mailOptions);
      return NextResponse.json({ success: true, message: "Form submitted successfully (development mode)" });
    }
    
    // Send email in production
    await transporter.sendMail(mailOptions);
    
    return NextResponse.json({ success: true, message: "Message sent successfully" });
  } catch (error) {
    console.error("Error processing contact form:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
} 