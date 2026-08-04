import { Injectable, Logger } from "@nestjs/common";
import nodemailer from "nodemailer";

type EmailDelivery = { deliveryMode: "resend" | "email" | "console" };

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  /**
   * Picks a provider in order: Resend (if RESEND_API_KEY is set) > SMTP (if
   * configured) > console log. Every public method below funnels through
   * here so there is exactly one place that decides how mail actually goes
   * out.
   */
  private async deliverEmail(to: string, subject: string, text: string): Promise<EmailDelivery> {
    const from = process.env.MAIL_FROM ?? "Fleet Platform <no-reply@fleet.local>";
    const resendApiKey = process.env.RESEND_API_KEY;

    if (resendApiKey) {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ from, to, subject, text })
      });

      if (!response.ok) {
        const body = await response.text();
        this.logger.error(`Falha ao enviar e-mail via Resend (${response.status}): ${body}`);
        throw new Error("Falha ao enviar e-mail via Resend.");
      }

      return { deliveryMode: "resend" };
    }

    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const password = process.env.SMTP_PASSWORD;

    if (!host || !user || !password) {
      return { deliveryMode: "console" };
    }

    const port = Number(process.env.SMTP_PORT ?? 587);
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass: password }
    });

    await transporter.sendMail({ from, to, subject, text });
    return { deliveryMode: "email" };
  }

  async sendPasswordResetCode(email: string, code: string, fullName?: string) {
    const text = [
      `Olá${fullName ? `, ${fullName}` : ""}.`,
      "",
      `Seu código de recuperação de senha é: ${code}`,
      "Ele expira em 10 minutos.",
      "Se você não solicitou a troca, ignore esta mensagem."
    ].join("\n");

    const delivery = await this.deliverEmail(email, "Código de recuperação de senha - Fleet Platform", text);

    if (delivery.deliveryMode === "console") {
      this.logger.warn(`E-mail não configurado. Código de reset não enviado para ${email}.`);
    }

    return { deliveryMode: delivery.deliveryMode };
  }

  async sendDriverCredentials(email: string, temporaryPassword: string, fullName: string) {
    const text = [
      `Olá, ${fullName}.`,
      "",
      "Sua conta de motorista foi cadastrada no Fleet Platform.",
      `E-mail de acesso: ${email}`,
      `Senha temporária: ${temporaryPassword}`,
      "Você precisará trocar a senha no primeiro acesso."
    ].join("\n");

    const delivery = await this.deliverEmail(email, "Seu acesso ao Fleet Platform", text);

    if (delivery.deliveryMode === "console") {
      this.logger.warn(`E-mail não configurado. Senha temporária de ${email} não enviada por e-mail.`);
    }

    return { deliveryMode: delivery.deliveryMode };
  }
}
