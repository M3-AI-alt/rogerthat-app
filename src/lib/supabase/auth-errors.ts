function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;

    if (typeof message === "string") {
      return message;
    }
  }

  return "";
}

export function getFriendlyAuthError(error: unknown): string {
  const message = getErrorMessage(error);
  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage.includes("invalid login credentials")) {
    return "Email or password is incorrect. If you just created an account, check if email confirmation is required.";
  }

  if (
    normalizedMessage.includes("email not confirmed") ||
    normalizedMessage.includes("confirm")
  ) {
    return "Check your email to confirm your account before login.";
  }

  if (
    normalizedMessage.includes("invalid email") ||
    normalizedMessage.includes("email address")
  ) {
    return "Use a real email address that can receive confirmation email. Test domains like example.com can be rejected by Supabase.";
  }

  if (!message) {
    return "Something went wrong. Please try again.";
  }

  return message;
}
