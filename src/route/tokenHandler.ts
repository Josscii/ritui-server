import Koa from "koa";
import jsonwebtoken from "jsonwebtoken";
import { JWT_SECRET } from "./jwt.config";

export async function tokenExtract(ctx: Koa.Context, next: Koa.Next) {
  const { header } = ctx;

  if (header.authorization) {
    const parts = header.authorization.split(" ");
    if (parts.length === 2 && parts[0] === "Bearer") {
      const [, token] = parts;

      try {
        const decoded = jsonwebtoken.verify(
          token,
          JWT_SECRET
        ) as jsonwebtoken.JwtPayload;

        ctx.state.userId = decoded.data.id;
      } catch (error) {
        // do nothing
      }
    }
  }

  await next();
}

export async function tokenValidate(ctx: Koa.Context, next: Koa.Next) {
  if (!ctx.state.userId) {
    ctx.body = {
      error: {
        message: "登录状态失效，请重新登录",
      },
    };
    return;
  }

  await next();
}
