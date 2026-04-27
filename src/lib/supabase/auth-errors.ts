export function getFriendlyAuthError(message: string): string {
  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage.includes("invalid login credentials")) {
    return "Invalid login credentials. Check the email and password. If you created this user manually in Supabase, make sure the user has a password and the email is confirmed before login.";
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

  return message;
}
