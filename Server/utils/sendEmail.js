
const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

export async function sendVerificationEmail(email, token) {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  const senderEmail = process.env.BREVO_SENDER_EMAIL?.trim();
  const senderName = process.env.BREVO_SENDER_NAME || "YodhaX";
  const frontendUrl = process.env.CLIENT_URL?.trim();

  if (!apiKey || !senderEmail || !frontendUrl) {
    throw new Error(
      "Missing BREVO_API_KEY, BREVO_SENDER_EMAIL, or CLIENT_URL."
    );
  }

  if (
    typeof email !== "string" ||
    typeof token !== "string" ||
    !email.trim() ||
    !token.trim()
  ) {
    throw new Error("Recipient email and verification token are required.");
  }

  const baseUrl = frontendUrl.replace(/\/+$/, "");

  const verificationUrl =
    `${baseUrl}/verify-email?token=${encodeURIComponent(token)}`;

  const payload = {
    sender: {
      name: senderName,
      email: senderEmail,
    },
    to: [{ email: email.trim().toLowerCase() }],
    subject: "Verify your YodhaX account",

    htmlContent: `
      <!DOCTYPE html>
      <html lang="en">
        <body style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Welcome to YodhaX!</h2>
          <p>Please verify your email address to activate your account.</p>
          <p>
            <a href="${verificationUrl}"
               style="display:inline-block;padding:12px 20px;
               background:#2563eb;color:#ffffff;text-decoration:none;
               border-radius:6px;">
              Verify Email Address
            </a>
          </p>
          <p>This verification link expires in 15 minutes.</p>
          <p>If you did not create an account, ignore this email.</p>
        </body>
      </html>
    `,

    textContent: `
Welcome to YodhaX!

Verify your email address:
${verificationUrl}

This link expires in 15 minutes.
    `.trim(),
  };

  let response;

  try {
    response = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000),
    });
  } catch (error) {
    console.error("Brevo network error:", error.message);
    throw new Error("Could not connect to Brevo email API.");
  }

  const responseText = await response.text();

  let result = {};

  try {
    result = responseText ? JSON.parse(responseText) : {};
  } catch {
    result = { message: responseText };
  }

  if (!response.ok) {
    // Do not log the API key or verification token.
    console.error("Brevo API rejected the email:", {
      status: response.status,
      code: result.code,
      message: result.message,
    });

    throw new Error(
      `Brevo rejected the email (HTTP ${response.status}): ${
        result.message || result.code || "Unknown error"
      }`
    );
  }

  console.log("Brevo accepted verification email:", result.messageId);

  return result;
}
