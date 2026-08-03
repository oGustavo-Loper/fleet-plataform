import { Injectable, Logger } from "@nestjs/common";
import nodemailer from "nodemailer";

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  async sendPasswordResetCode(email: string, code: string, fullName?: string) {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const password = process.env.SMTP_PASSWORD;
    const port = Number(process.env.SMTP_PORT ?? 587);
    const from = process.env.MAIL_FROM ?? "Fleet Platform <no-reply@fleet.local>";

    if (!host || !user || !password) {
      this.logger.warn(`SMTP não configurado. Código de reset para ${email}: ${code}`);
      return { deliveryMode: "console", debugCode: code };
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: Number(process.env.SMTP_PORT ?? 587) === 465,
      auth: {
        user,
        pass: password
      }
    });

    await transporter.sendMail({
      from,
      to: email,
      subject: "Código de recuperação de senha - Fleet Platform",
      text: [
        `Olá${fullName ? `, ${fullName}` : ""}.`,
        "",
        `Seu código de recuperação de senha é: ${code}`,
        "Ele expira em 10 minutos.",
        "Se você não solicitou a troca, ignore esta mensagem."
      ].join("\n")
    });

    return { deliveryMode: "email" };
  }

  async sendDriverCredentials(email: string, temporaryPassword: string, fullName: string) {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const password = process.env.SMTP_PASSWORD;
    const port = Number(process.env.SMTP_PORT ?? 587);
    const from = process.env.MAIL_FROM ?? "Fleet Platform <no-reply@fleet.local>";

    if (!host || !user || !password) {
      this.logger.warn(`SMTP não configurado. Senha temporária de ${email}: ${temporaryPassword}`);
      return { deliveryMode: "console", debugPassword: temporaryPassword };
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: Number(process.env.SMTP_PORT ?? 587) === 465,
      auth: {
        user,
        pass: password
      }
    });

    await transporter.sendMail({
      from,
      to: email,
      subject: "Seu acesso ao Fleet Platform",
      text: [
        `Olá, ${fullName}.`,
        "",
        "Sua conta de motorista foi cadastrada no Fleet Platform.",
        `E-mail de acesso: ${email}`,
        `Senha temporária: ${temporaryPassword}`,
        "Você precisará trocar a senha no primeiro acesso."
      ].join("\n")
    });

    return { deliveryMode: "email" };
  }
}
