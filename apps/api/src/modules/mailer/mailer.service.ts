import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as handlebars from 'handlebars';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import nodemailer, { type Transporter } from 'nodemailer';

@Injectable()
export class MailerService {
  private readonly transporter: Transporter;
  private readonly from: string;
  private readonly appUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.from = this.configService.getOrThrow<string>('MAILTRAP_FROM');
    this.appUrl = this.configService.getOrThrow<string>('APP_URL').replace(/\/$/, '');

    this.transporter = nodemailer.createTransport({
      host: this.configService.getOrThrow<string>('MAILTRAP_HOST'),
      port: Number(this.configService.getOrThrow<string>('MAILTRAP_PORT')),
      auth: {
        user: this.configService.getOrThrow<string>('MAILTRAP_USER'),
        pass: this.configService.getOrThrow<string>('MAILTRAP_PASS'),
      },
    });
  }

  async enviarInvitacion(correo: string, token: string): Promise<void> {
    const template = await this.cargarTemplate('invitacion.hbs');
    const html = template({
      urlInvitacion: `${this.appUrl}/invitacion/${encodeURIComponent(token)}`,
      anioActual: new Date().getFullYear(),
    });

    await this.transporter.sendMail({
      from: this.from,
      to: correo,
      subject: 'Invitación a Fitness SaaS',
      html,
    });
  }

  private async cargarTemplate(nombre: string): Promise<handlebars.TemplateDelegate> {
    const templatePath = join(__dirname, 'templates', nombre);
    const contenido = await readFile(templatePath, 'utf8');

    return handlebars.compile(contenido);
  }
}
