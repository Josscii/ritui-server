import Koa from "koa";
import logger from "koa-logger";
import { unProtectedApiRouter, protectedApiRouter } from "./route/mpapi";
import { dbInit } from "./model/db";
import { tokenExtract, tokenValidate } from "./route/tokenHandler";
import { wapi } from "./route/wapi";
import cors from "@koa/cors";

dbInit();

const app = new Koa();

app.use(logger());

app.use(cors());

app.use(tokenExtract);

app.use(wapi.routes());
app.use(wapi.allowedMethods());

app.use(unProtectedApiRouter.routes());
app.use(unProtectedApiRouter.allowedMethods());

app.use(tokenValidate);

app.use(protectedApiRouter.routes());
app.use(protectedApiRouter.allowedMethods());

app.listen(3001);
