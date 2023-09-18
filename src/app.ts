import fastify from "fastify"
import cookies from "@fastify/cookie"

import { env } from "./env"
import { trasactionsRoutes } from "./routes/trasactions"

export const app = fastify()

app.register(cookies)

app.register(trasactionsRoutes, {
  prefix: "trasactions",
})
