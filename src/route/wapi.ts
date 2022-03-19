import Router from "@koa/router";
import { Op } from "@sequelize/core";
import koaBody from "koa-body";
import Candidate from "../model/Candidate";
import Daily from "../model/Daily";
import User from "../model/User";

const wapi = new Router({
  prefix: "/wapi",
});

wapi.get("/daily", async (ctx) => {
  const todayZeroDate = new Date();
  todayZeroDate.setHours(0, 0, 0, 0);

  const daily = await Daily.findOne({
    where: {
      createdAt: {
        [Op.gte]: todayZeroDate,
      },
      status: 0,
    },
  });

  if (!daily) {
    ctx.body = {
      error: {
        message: "没有待审核的内容",
      },
    };
    return;
  }

  const user = await User.findByPk(daily.userId);
  if (user) {
    ctx.body = {
      data: {
        ...daily.toJSON(),
        nickName: user.nickName,
        avatarUrl: user.avatarUrl,
      },
    };
  } else {
    ctx.body = {
      data: daily.toJSON(),
    };
  }
});

wapi.post("/audit", koaBody(), async (ctx) => {
  const body = ctx.request.body ?? {};
  const { id, status } = body;

  if (id == undefined || status == undefined) {
    ctx.body = {
      error: {
        message: "缺少必要参数",
      },
    };
    return;
  }

  const daily = await Daily.findByPk(id);

  if (!daily) {
    ctx.body = {
      error: {
        message: "数据不存在",
      },
    };
    return;
  }

  daily.set("status", status);
  await daily.save();

  const user = await User.findByPk(daily.userId);

  if (user) {
    user.set("ban", 1);
    await user.save();

    await Candidate.destroy({
      where: {
        userId: user.id,
      },
    });
  }

  ctx.body = {};
});

export { wapi };
