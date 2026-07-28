import "reflect-metadata";

import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { join } from "node:path";

import { AppModule } from "./app.module.js";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: true,
    credentials: true
  });

  const mediaStorageDir = process.env.MEDIA_STORAGE_DIR ?? join(process.cwd(), "uploads");
  (app as NestExpressApplication).useStaticAssets(mediaStorageDir, {
    prefix: "/media/"
  });

  const host = process.env.HOST ?? "127.0.0.1";
  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port, host);
}

void bootstrap();
