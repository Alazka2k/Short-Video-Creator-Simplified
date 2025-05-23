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
    // Debug environment loading
    console.log("API Route Environment Check:");
    console.log("NODE_ENV:", process.env.NODE_ENV);
    
    // Check if required SMTP variables are available
    const requiredVars = [
      'SMTP_HOST',
      'SMTP_PORT',
      'SMTP_SECURE',
      'SMTP_USER', 
      'SMTP_PASSWORD', 
      'CONTACT_FROM_EMAIL', 
      'CONTACT_TO_EMAIL'
    ];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.error("Missing required environment variables:", missingVars);
      return NextResponse.json(
        { error: "SMTP configuration incomplete", details: `Missing: ${missingVars.join(', ')}` },
        { status: 500 }
      );
    }
    
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

    //Add mailhog later as a development tool for testing emails
    
    // In a production environment, you would use real SMTP credentials
    // This is a basic example using a transporter that logs to console
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
    
    // Prepare email content
    const mailOptions = {
      from: `"Narravid Contact Form" <${process.env.CONTACT_FROM_EMAIL}>`,
      to: process.env.CONTACT_TO_EMAIL,
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
    
    // For development, log the email details but still send it
    if (process.env.NODE_ENV === "development") {
      console.log("========= EMAIL DETAILS (DEVELOPMENT MODE) =========");
      console.log("Email configuration:", {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE === "true",
        user: process.env.SMTP_USER,
        fromEmail: process.env.CONTACT_FROM_EMAIL,
        toEmail: process.env.CONTACT_TO_EMAIL
      });
      console.log("Email content:", {
        from: mailOptions.from,
        to: mailOptions.to,
        subject: mailOptions.subject,
        replyTo: mailOptions.replyTo,
        message: message.substring(0, 100) + (message.length > 100 ? '...' : '')
      });
      console.log("=================================================");
      
      // No early return - continue to send the email
    }
    
    // Send email in both development and production
    try {
      await transporter.sendMail(mailOptions);
      console.log("Email sent successfully!");
      return NextResponse.json({ success: true, message: "Message sent successfully" });
    } catch (emailError) {
      console.error("Failed to send email:", emailError);
      return NextResponse.json(
        { error: "Failed to send email", details: emailError instanceof Error ? emailError.message : "Unknown error" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error processing contact form:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
} 