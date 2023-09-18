import { z } from "zod"
import crypto, { randomUUID } from "node:crypto"
import { knex } from "../database"
import { FastifyInstance } from "fastify"
import { checkSessionsIdExists } from "../middleware/check-sessions-id-exists"

export async function trasactionsRoutes(app: FastifyInstance) {
  app.get(
    "/",
    {
      preHandler: [checkSessionsIdExists],
    },
    async (request, reply) => {
      const { sessionId } = request.cookies

      const trasactions = await knex("trasactions")
        .where("session_id", sessionId)
        .select()

      return {
        trasactions,
      }
    }
  )

  app.get(
    "/:id",
    {
      preHandler: [checkSessionsIdExists],
    },
    async (request) => {
      const getTransactionsParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const { sessionId } = request.cookies

      const { id } = getTransactionsParamsSchema.parse(request.params)

      const trasactions = await knex("trasactions")
        .where({
          id,
          session_id: sessionId,
        })
        .first()

      return {
        trasactions,
      }
    }
  )

  app.get(
    "/summary",
    {
      preHandler: [checkSessionsIdExists],
    },
    async (request) => {
      const { sessionId } = request.cookies

      const summary = await knex("trasactions")
        .where("session_id", sessionId)
        .sum("amount", { as: "amount" })
        .first()

      return { summary }
    }
  )

  app.post("/", async (request, reply) => {
    const createTransactionsSchema = z.object({
      title: z.string(),
      amount: z.number(),
      type: z.enum(["credit", "debit"]),
    })

    const { title, amount, type } = createTransactionsSchema.parse(request.body)

    let sessionId = request.cookies.sessionId

    if (!sessionId) {
      sessionId = randomUUID()

      reply.cookie("sessionId", sessionId, {
        path: "/",
        maxAge: 1000 * 60 * 60 * 24 * 7, //7 days
      })
    }

    await knex("trasactions").insert({
      id: crypto.randomUUID(),
      title,
      amount: type == "credit" ? amount : amount * -1,
      session_id: sessionId,
    })

    return reply.status(201).send()
  })
}
