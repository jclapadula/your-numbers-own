import { Router } from "express";
import type { Request, Response } from "express";
import { db } from "../../db";
import { authenticate, authorizeRequest } from "../middlewares";
import type { Category, CategoryGroup } from "../../services/models";
import { categoriesService } from "../../services/categoriesService";

export const categoriesRouter = Router();

categoriesRouter.use(authenticate);
categoriesRouter.use(authorizeRequest);

categoriesRouter.get(
  "/budgets/:budgetId/category-groups",
  async (
    req: Request<{ budgetId: string }>,
    res: Response<CategoryGroup[]>
  ) => {
    const categoryGroups = await db
      .selectFrom("category_groups")
      .where("budgetId", "=", req.params.budgetId)
      .orderBy("position", "asc")
      .select(["id", "name", "position"])
      .execute();

    res.json(categoryGroups);
  }
);

categoriesRouter.post(
  "/budgets/:budgetId/category-groups",
  async (
    req: Request<{ budgetId: string }, any, { name: string }>,
    res: Response
  ) => {
    const highestPosition = (
      await db
        .selectFrom("category_groups")
        .where("budgetId", "=", req.params.budgetId)
        .select((eb) => eb.fn.max("position").as("maxPosition"))
        .executeTakeFirst()
    )?.maxPosition;

    const position = highestPosition === undefined ? 0 : highestPosition + 1;

    const { id } = await db
      .insertInto("category_groups")
      .values({ name: req.body.name, budgetId: req.params.budgetId, position })
      .returning(["id"])
      .executeTakeFirstOrThrow();

    res.json({ id });
  }
);

categoriesRouter.put(
  "/budgets/:budgetId/category-groups/:categoryGroupId",
  async (
    req: Request<
      { budgetId: string; categoryGroupId: string },
      any,
      { name: string }
    >,
    res: Response
  ) => {
    const { categoryGroupId } = req.params;
    const { name } = req.body;

    await db
      .updateTable("category_groups")
      .set({ name })
      .where("id", "=", categoryGroupId)
      .execute();

    res.status(200).send({});
  }
);

categoriesRouter.delete(
  "/budgets/:budgetId/category-groups/:categoryGroupId",
  async (
    req: Request<{ budgetId: string; categoryGroupId: string }>,
    res: Response
  ) => {
    const { categoryGroupId } = req.params;
    await db
      .deleteFrom("category_groups")
      .where("id", "=", categoryGroupId)
      .execute();
    res.status(200).send({});
  }
);

categoriesRouter.put(
  "/budgets/:budgetId/category-groups/:categoryGroupId/move",
  async (
    req: Request<
      { budgetId: string; categoryGroupId: string },
      any,
      any,
      { newPosition: number }
    >,
    res: Response
  ) => {
    await db.transaction().execute(async (tx) => {
      await categoriesService.moveCategoryGroup(
        tx,
        req.params.budgetId,
        req.params.categoryGroupId,
        req.body.newPosition
      );
    });

    res.status(200).send({});
  }
);

categoriesRouter.get(
  "/budgets/:budgetId/categories",
  async (req: Request<{ budgetId: string }>, res: Response<Category[]>) => {
    const categories = await db
      .selectFrom("categories")
      .where("budgetId", "=", req.params.budgetId)
      .orderBy("name", "asc")
      .select(["id", "name", "position", "groupId"])
      .execute();

    res.json(categories);
  }
);

categoriesRouter.post(
  "/budgets/:budgetId/categories",
  async (
    req: Request<
      { budgetId: string },
      any,
      { name: string; categoryGroupId: string }
    >,
    res: Response
  ) => {
    const { name, categoryGroupId } = req.body;

    const highestPosition = (
      await db
        .selectFrom("categories")
        .where("budgetId", "=", req.params.budgetId)
        .select((eb) => eb.fn.max("position").as("maxPosition"))
        .executeTakeFirst()
    )?.maxPosition;

    const position = highestPosition === undefined ? 0 : highestPosition + 1;

    const category = await db
      .insertInto("categories")
      .values({
        budgetId: req.params.budgetId,
        groupId: categoryGroupId,
        name,
        position,
      })
      .returning(["id"])
      .executeTakeFirstOrThrow();

    res.status(200).send(category);
  }
);

categoriesRouter.put(
  "/budgets/:budgetId/categories/:categoryId",
  async (
    req: Request<
      { budgetId: string; categoryId: string },
      any,
      { name: string }
    >,
    res: Response
  ) => {
    const { categoryId = "" } = req.params;
    const { name } = req.body;

    await db
      .updateTable("categories")
      .set({ name })
      .where("id", "=", categoryId)
      .execute();

    res.status(200).send({});
  }
);

categoriesRouter.delete(
  "/budgets/:budgetId/categories/:categoryId",
  async (
    req: Request<{ budgetId: string; categoryId: string }>,
    res: Response
  ) => {
    const { categoryId = "" } = req.params;

    await db.deleteFrom("categories").where("id", "=", categoryId).execute();

    res.status(200).send({});
  }
);

categoriesRouter.put(
  "/budgets/:budgetId/categories/:categoryId/move",
  async (
    req: Request<
      { budgetId: string; categoryId: string },
      any,
      any,
      { newPosition: number; categoryGroupId: string }
    >,
    res: Response
  ) => {
    await db.transaction().execute(async (tx) => {
      await categoriesService.moveCategory(
        tx,
        req.params.budgetId,
        req.body.categoryGroupId,
        req.params.categoryId,
        req.body.newPosition
      );
    });

    res.status(200).send({});
  }
);
