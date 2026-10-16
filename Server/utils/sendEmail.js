
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_ADDRESS,
    pass: process.env.EMAIL_SECURITY_PASSWORD,
  },
});

export async function sendVerificationEmail(email, token) {
  const verificationUrl = new URL(
    "/verify-email",
    process.env.CLIENT_URL
  );

  verificationUrl.searchParams.set("token", token);

  try {
    const info = await transporter.sendMail({
      from: `"Verifhir" <${process.env.EMAIL_ADDRESS}>`,
      to: email,
      subject: "Verify your Verifhir email address",
      text: [
        "Welcome to Verifhir!",
        "",
        "Click the link below to verify your email address:",
        verificationUrl.toString(),
        "",
        "This link expires in 15 minutes.",
        "If you did not create this account, you can ignore this email.",
      ].join("\n"),
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:32px;color:#171727">
          <h1 style="color:#7955e8">Welcome to Verifhir</h1>
          <p>Verify your email address to activate your account.</p>
          <a
            href="${verificationUrl.toString()}"
            style="display:inline-block;padding:14px 22px;background:#7955e8;color:white;text-decoration:none;border-radius:8px"
          >
            Verify my email
          </a>
          <p style="margin-top:24px;color:#666;font-size:13px">
            This link expires in 15 minutes. If you did not create this account,
            you can ignore this email.
          </p>
        </div>
      `,
    });

    console.log("Verification email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Verification email failed:", {
      code: error.code,
      message: error.message,
      response: error.response,
    });

    throw error;
  }
}

export default sendVerificationEmail;
