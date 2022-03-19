import Router from "@koa/router";
import koaBody from "koa-body";
import axios from "axios";
import jsonwebtoken from "jsonwebtoken";
import { JWT_SECRET, JWT_EXP_TIME } from "./jwt.config";
import User from "../model/User";
import Daily from "../model/Daily";
import { Op } from "@sequelize/core";
import Response from "../model/Response";
import Candidate from "../model/Candidate";

const unProtectedApiRouter = new Router({
  prefix: "/mpapi",
});

unProtectedApiRouter.post("/login", koaBody(), async (ctx) => {
  const { code, userInfo } = ctx.request.body ?? {};

  if (code == undefined || userInfo == undefined) {
    ctx.body = {
      error: {
        message: "缺少必要参数",
      },
    };
    return;
  }

  try {
    const response = await axios.get(
      `https://api.weixin.qq.com/sns/jscode2session?appid=wx85e1c72ec631c0ba&secret=34563a88284c9567763b319f4df41262&js_code=${code}&grant_type=authorization_code`
    );

    const { openid, unionid } = response.data;

    if (!openid) {
      ctx.body = {
        error: {
          message: "wx jscode2session error",
        },
      };
      return;
    }

    const [user] = await User.findOrCreate({
      where: {
        openid,
      },
      defaults: {
        ...userInfo,
        openid,
        unionid,
      },
    });

    const result = {
      ...userInfo,
      id: user.id,
    };

    const token = jsonwebtoken.sign(
      {
        data: result,
      },
      JWT_SECRET,
      {
        expiresIn: JWT_EXP_TIME,
      }
    );

    ctx.body = {
      data: {
        userInfo: result,
        token,
      },
    };
  } catch (error) {
    if (error instanceof Error) {
      ctx.body = {
        error: {
          message: error.message,
        },
      };
    }
  }
});

unProtectedApiRouter.get("/daily", async (ctx) => {
  const todayZeroDate = new Date();
  todayZeroDate.setHours(0, 0, 0, 0);

  const daily = await Daily.findOne({
    where: {
      createdAt: {
        [Op.gte]: todayZeroDate,
      },
      status: {
        [Op.not]: 2,
      },
    },
  });

  const userId = ctx.state.userId;

  if (!daily) {
    if (!userId) {
      ctx.body = {
        data: {
          status: 0,
        },
      };
      return;
    }

    // 如果用户没有被 ban，而且上次发布的时间超过30天，那么就进入备选列表
    const user = await User.findByPk(userId);

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const ban = user!.ban;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const lastPostAt = user!.lastPostAt;

    const can =
      !lastPostAt ||
      new Date().getTime() - lastPostAt.getTime() > 30 * 24 * 60 * 60 * 1000;

    if (!ban && can) {
      await Candidate.findOrCreate({
        where: {
          createdAt: {
            [Op.gte]: todayZeroDate,
          },
        },
        defaults: {
          userId,
          createdAt: new Date(),
        },
      });
    }

    const todayCandidate = await Candidate.findOne({
      where: {
        createdAt: {
          [Op.gte]: todayZeroDate,
        },
        status: 0,
      },
      order: [["createdAt", "ASC"]],
    });

    if (todayCandidate && todayCandidate.userId === userId) {
      ctx.body = {
        data: {
          status: 1,
        },
      };
    } else {
      ctx.body = {
        data: {
          status: 0,
        },
      };
    }

    return;
  }

  // status 0 还未发布 1 准备发布 2 发布待审核 3 发布成功

  // 如果在审核
  if (daily.status === 0) {
    if (userId && daily.userId === userId) {
      ctx.body = {
        data: {
          status: 2,
        },
      };
    } else {
      ctx.body = {
        data: {
          status: 0,
        },
      };
    }

    return;
  }

  let responseType = 0;

  if (userId) {
    const response = await Response.findOne({
      where: {
        userId: userId,
        dailyId: daily.id,
      },
    });

    if (response) {
      responseType = response.type;
    }
  }

  const responseCount = await Response.count({
    where: {
      dailyId: daily.id,
      type: 1,
    },
  });

  const user = await User.findByPk(daily.userId);
  if (daily.showUserInfo && user) {
    ctx.body = {
      data: {
        status: 3,
        data: {
          ...daily.toJSON(),
          responseType,
          responseCount,
          nickName: user.nickName,
          avatarUrl: user.avatarUrl,
        },
      },
    };
  } else {
    ctx.body = {
      data: {
        status: 3,
        data: {
          ...daily.toJSON(),
          responseType,
          responseCount,
        },
      },
    };
  }
});

const protectedApiRouter = new Router({ prefix: "/mpapi" });

protectedApiRouter.post("/refuse", async (ctx) => {
  const userId = ctx.state.userId;

  const todayZeroDate = new Date();
  todayZeroDate.setHours(0, 0, 0, 0);
  const candidate = await Candidate.findOne({
    where: {
      createdAt: {
        [Op.gte]: todayZeroDate,
      },
      userId,
    },
  });

  // candidate may be null, but it's rare, so just ignore it.
  if (candidate) {
    candidate.set("status", 1);
    await candidate.save();
  }

  ctx.body = {
    data: {},
  };
});

protectedApiRouter.post("/post", koaBody(), async (ctx) => {
  const todayZeroDate = new Date();
  todayZeroDate.setHours(0, 0, 0, 0);

  const daily = await Daily.findOne({
    where: {
      createdAt: {
        [Op.gte]: todayZeroDate,
      },
      status: {
        [Op.or]: [0, 1],
      },
    },
  });

  if (daily) {
    ctx.body = {
      error: {
        message: "今天已经发布过了",
      },
    };
    return;
  }

  const { text, showUserInfo } = ctx.request.body ?? {};

  if (text == undefined || showUserInfo == undefined) {
    ctx.body = {
      error: {
        message: "缺少必要参数",
      },
    };
    return;
  }

  const userId = ctx.state.userId;

  await Daily.create({
    text,
    userId,
    showUserInfo,
  });

  const user = await User.findByPk(userId);

  if (user) {
    user.set("lastPostAt", new Date());
    await user.save();
  }

  ctx.body = {
    data: {},
  };
});

protectedApiRouter.post("/response", koaBody(), async (ctx) => {
  const { dailyId, type } = ctx.request.body ?? {};

  if (dailyId == undefined || type == undefined) {
    ctx.body = {
      error: {
        message: "缺少必要参数",
      },
    };
    return;
  }

  const userId = ctx.state.userId;

  const [response, creation] = await Response.findOrCreate({
    where: {
      dailyId,
      userId,
    },
    defaults: {
      dailyId,
      userId,
      type: type,
    },
  });

  if (!creation) {
    response.set("type", type);
    await response.save();
  }

  ctx.body = {
    data: {},
  };
});

export { unProtectedApiRouter, protectedApiRouter };
