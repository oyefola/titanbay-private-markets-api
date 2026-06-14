import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { FastifyInstance } from "fastify";
import { buildApp } from "../../src/app";
import { prisma } from "../../src/db";

const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;

const validCreateFundBody = {
  name: "Titanbay Growth Fund I",
  vintage_year: 2024,
  target_size_usd: 250000000,
  status: "Fundraising" as const,
};

async function createFund(overrides = {}) {
  return prisma.fund.create({
    data: {
      ...validCreateFundBody,
      ...overrides,
    },
  });
}

describe("fund routes", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildApp();
    await app.ready();
  });

  beforeEach(async () => {
    await prisma.$executeRawUnsafe(
      "TRUNCATE TABLE investments, investors, funds RESTART IDENTITY CASCADE"
    );
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  describe("GET /funds", () => {
    it("returns an empty array when there are no funds", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/funds",
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual([]);
    });

    it("returns all funds", async () => {
      await createFund({
        name: "Titanbay Growth Fund I",
      });

      await createFund({
        name: "Titanbay Growth Fund II",
        vintage_year: 2025,
        target_size_usd: 500000000,
        status: "Investing",
      });

      const response = await app.inject({
        method: "GET",
        url: "/funds",
      });

      expect(response.statusCode).toBe(200);

      const body = response.json();

      expect(body).toHaveLength(2);
      expect(body[0]).toEqual(
        expect.objectContaining({
          id: expect.stringMatching(UUID_REGEX),
          name: "Titanbay Growth Fund I",
          vintage_year: 2024,
          target_size_usd: 250000000,
          status: "Fundraising",
          created_at: expect.any(String),
        })
      );
    });
  });

  describe("POST /funds", () => {
    it("creates a fund", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/funds",
        headers: {
          "content-type": "application/json",
        },
        payload: validCreateFundBody,
      });

      expect(response.statusCode).toBe(201);

      const body = response.json();

      expect(body).toEqual({
        id: expect.stringMatching(UUID_REGEX),
        name: "Titanbay Growth Fund I",
        vintage_year: 2024,
        target_size_usd: 250000000,
        status: "Fundraising",
        created_at: expect.any(String),
      });

      const fundInDb = await prisma.fund.findUnique({
        where: {
          id: body.id,
        },
      });

      expect(fundInDb).not.toBeNull();
    });

    it("returns 400 when required fields are missing", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/funds",
        headers: {
          "content-type": "application/json",
        },
        payload: {
          name: "Titanbay Growth Fund I",
          status: "Fundraising",
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it("returns 400 when status is invalid", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/funds",
        headers: {
          "content-type": "application/json",
        },
        payload: {
          ...validCreateFundBody,
          status: "Raising Money",
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it("returns 400 when target_size_usd is not positive", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/funds",
        headers: {
          "content-type": "application/json",
        },
        payload: {
          ...validCreateFundBody,
          target_size_usd: -1,
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe("GET /funds/:id", () => {
    it("returns a fund by id", async () => {
      const fund = await createFund();

      const response = await app.inject({
        method: "GET",
        url: `/funds/${fund.id}`,
      });

      expect(response.statusCode).toBe(200);

      expect(response.json()).toEqual({
        id: fund.id,
        name: "Titanbay Growth Fund I",
        vintage_year: 2024,
        target_size_usd: 250000000,
        status: "Fundraising",
        created_at: expect.any(String),
      });
    });

    it("returns 400 when id is not a UUID", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/funds/not-a-uuid",
      });

      expect(response.statusCode).toBe(400);
    });

    it("returns 404 when fund does not exist", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/funds/550e8400-e29b-41d4-a716-446655449999",
      });

      expect(response.statusCode).toBe(404);

      expect(response.json()).toEqual({
        error: {
          code: "NOT_FOUND",
          message: "Fund not found",
        },
      });
    });
  });

  describe("PUT /funds", () => {
    it("updates an existing fund", async () => {
      const fund = await createFund();

      const response = await app.inject({
        method: "PUT",
        url: "/funds",
        headers: {
          "content-type": "application/json",
        },
        payload: {
          id: fund.id,
          name: "Titanbay Growth Fund I",
          vintage_year: 2024,
          target_size_usd: 300000000,
          status: "Investing",
        },
      });

      expect(response.statusCode).toBe(200);

      expect(response.json()).toEqual({
        id: fund.id,
        name: "Titanbay Growth Fund I",
        vintage_year: 2024,
        target_size_usd: 300000000,
        status: "Investing",
        created_at: expect.any(String),
      });

      const fundInDb = await prisma.fund.findUnique({
        where: {
          id: fund.id,
        },
      });

      expect(Number(fundInDb?.target_size_usd)).toBe(300000000);
      expect(fundInDb?.status).toBe("Investing");
    });

    it("returns 400 when id is invalid", async () => {
      const response = await app.inject({
        method: "PUT",
        url: "/funds",
        headers: {
          "content-type": "application/json",
        },
        payload: {
          id: "not-a-uuid",
          name: "Titanbay Growth Fund I",
          vintage_year: 2024,
          target_size_usd: 300000000,
          status: "Investing",
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it("returns 404 when fund does not exist", async () => {
      const response = await app.inject({
        method: "PUT",
        url: "/funds",
        headers: {
          "content-type": "application/json",
        },
        payload: {
          id: "550e8400-e29b-41d4-a716-446655449999",
          name: "Missing Fund",
          vintage_year: 2024,
          target_size_usd: 300000000,
          status: "Investing",
        },
      });

      expect(response.statusCode).toBe(404);

      expect(response.json()).toEqual({
        error: {
          code: "NOT_FOUND",
          message: "Fund not found",
        },
      });
    });
  });
});