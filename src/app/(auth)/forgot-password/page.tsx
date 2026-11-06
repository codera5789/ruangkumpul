import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/modules/auth/components/forgot-password-form";

export const metadata: Metadata = {
  title: "Lupa Password",
  description: "Reset password akun RuangKumpul kamu melalui email.",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
