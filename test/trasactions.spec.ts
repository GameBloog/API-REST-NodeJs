import { app } from "../src/app"
import { execSync } from "node:child_process"
import request from "supertest"
import { it, beforeAll, afterAll, describe, expect, beforeEach } from "vitest"

describe("Trasactions routes", () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    execSync("npm run knex migrate:rollback --all")
    execSync("npm run knex migrate:latest")
  })

  it("should be able to create a new transaction", async () => {
    await request(app.server)
      .post("/trasactions")
      .send({
        title: "New transaction",
        amount: 500,
        type: "credit",
      })
      .expect(201)
  })

  it("should be able to list all transactions", async () => {
    const createTransactionResponse = await request(app.server)
      .post("/trasactions")
      .send({
        title: "New transaction",
        amount: 500,
        type: "credit",
      })

    const cookies = createTransactionResponse.get("Set-Cookie")

    const listTransactionsReponse = await request(app.server)
      .get("/trasactions")
      .set("Cookie", cookies)
      .expect(200)
    expect(listTransactionsReponse.body.trasactions).toEqual([
      expect.objectContaining({
        title: "New transaction",
        amount: 500,
      }),
    ])
  })

  it("should be able to get a specific transaction", async () => {
    const createTransactionResponse = await request(app.server)
      .post("/trasactions")
      .send({
        title: "New transaction",
        amount: 500,
        type: "credit",
      })

    const cookies = createTransactionResponse.get("Set-Cookie")

    const listTransactionsReponse = await request(app.server)
      .get("/trasactions")
      .set("Cookie", cookies)
      .expect(200)

    const trasactionId = listTransactionsReponse.body.trasactions[0].id

    const getTransactionsResponse = await request(app.server)
      .get(`/trasactions/${trasactionId}`)
      .set("Cookie", cookies)
      .expect(200)

    expect(getTransactionsResponse.body.trasactions).toEqual(
      expect.objectContaining({
        title: "New transaction",
        amount: 500,
      })
    )
  })

  it("should be able to get the summary", async () => {
    const createTransactionResponse = await request(app.server)
      .post("/trasactions")
      .send({
        title: "Credit transaction",
        amount: 5000,
        type: "credit",
      })

    const cookies = createTransactionResponse.get("Set-Cookie")

    await request(app.server).post("/trasactions").set("Cookie", cookies).send({
      title: "Debit transaction",
      amount: 2000,
      type: "debit",
    })

    const summaryResponse = await request(app.server)
      .get("/trasactions/summary")
      .set("Cookie", cookies)
      .expect(200)
    expect(summaryResponse.body.summary).toEqual({
      amount: 3000,
    })
  })
})
