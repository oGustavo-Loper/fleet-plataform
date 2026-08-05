import "reflect-metadata";

import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";

import { AppModule } from "./app.module.js";
import { resolveCorsOrigins } from "./common/cors.js";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: resolveCorsOrigins(),
    credentials: true
  });

  // Not whitelist/forbidNonWhitelisted: most DTOs only carry @Field()
  // (GraphQL schema shape), not class-validator decorators, so whitelist
  // mode would silently strip almost every input field. This activates
  // validation only where a DTO actually opts in with decorators.
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  // Media files are served through MediaController (tenant-scoped, behind
  // HttpJwtAuthGuard) instead of a public static-assets mount.

  const host = process.env.HOST ?? "127.0.0.1";
  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port, host);
}

void bootstrap();
