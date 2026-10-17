
const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

export async function sendVerificationEmail(email, token) {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME || "YodhaX";
  const frontendUrl = process.env.CLIENT_URL;

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
    throw new Error("A valid recipient email and verification token are required.");
  }

  // Remove a trailing slash from the frontend URL.
  const baseUrl = frontendUrl.replace(/\/+$/, "");

  // This URL must match your React verification route.
  const verificationUrl =
    `${baseUrl}/verify-email?token=${encodeURIComponent(token)}`;

  const payload = {
    sender: {
      name: senderName,
      email: senderEmail,
    },
    to: [
      {
        email: email.trim().toLowerCase(),
      },
    ],
    subject: "Verify your YodhaX account",
    htmlContent: `
      <!DOCTYPE html>
      <html lang="en">
        <body style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Welcome to YodhaX!</h2>

          <p>
            Please verify your email address to activate your account.
          </p>

          <p>
            <a
              href="${verificationUrl}"
              style="
                display: inline-block;
                padding: 12px 20px;
                background: #2563eb;
                color: #ffffff;
                text-decoration: none;
                border-radius: 6px;
              "
            >
              Verify Email Address
            </a>
          </p>

          <p>
            This verification link expires in 15 minutes.
          </p>

          <p>
            If you did not create a YodhaX account, you can ignore this email.
          </p>
        </body>
      </html>
    `,
    textContent: `
Welcome to YodhaX!

Verify your email address using this link:
${verificationUrl}

This link expires in 15 minutes.
    `.trim(),
  };

  const response = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const responseText = await response.text();

  let result;

  try {
    result = responseText ? JSON.parse(responseText) : {};
  } catch {
    result = { message: responseText };
  }

  if (!response.ok) {
    console.error("Brevo email API error:", {
      status: response.status,
      message: result.message || result,
    });

    throw new Error(
      `Brevo failed to send email (HTTP ${response.status}).`
    );
  }

  console.log("Verification email accepted by Brevo:", {
    messageId: result.messageId,
  });

  return result;
}
