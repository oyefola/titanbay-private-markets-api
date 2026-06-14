import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { FastifyInstance } from "fastify";
import { buildApp } from "../../src/app";
import { prisma } from "../../src/db";

const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;

const validCreateInvestorBody = {
  name: "CalPERS",
  investor_type: "Institution" as const,
  email: "privateequity@calpers.ca.gov",
};

async function createInvestor(overrides = {}) {
  return prisma.investor.create({
    data: {
      name: "CalPERS",
      investor_type: "Institution",
      email: "privateequity@calpers.ca.gov",
      ...overrides,
    },
  });
}

describe("investor routes", () => {
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

  describe("GET /investors", () => {
    it("returns an empty array when there are no investors", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/investors",
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual([]);
    });

    it("returns all investors", async () => {
      await createInvestor();

      await createInvestor({
        name: "Smith Family Office",
        investor_type: "Family_Office",
        email: "investments@smithfamily.com",
      });

      const response = await app.inject({
        method: "GET",
        url: "/investors",
      });

      expect(response.statusCode).toBe(200);

      const body = response.json();

      expect(body).toHaveLength(2);

      expect(body[0]).toEqual(
        expect.objectContaining({
          id: expect.stringMatching(UUID_REGEX),
          name: "CalPERS",
          investor_type: "Institution",
          email: "privateequity@calpers.ca.gov",
          created_at: expect.any(String),
        })
      );

      expect(body[1]).toEqual(
        expect.objectContaining({
          id: expect.stringMatching(UUID_REGEX),
          name: "Smith Family Office",
          investor_type: "Family Office",
          email: "investments@smithfamily.com",
          created_at: expect.any(String),
        })
      );
    });
  });

  describe("POST /investors", () => {
    it("creates an investor", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/investors",
        headers: {
          "content-type": "application/json",
        },
        payload: validCreateInvestorBody,
      });

      expect(response.statusCode).toBe(201);

      const body = response.json();

      expect(body).toEqual({
        id: expect.stringMatching(UUID_REGEX),
        name: "CalPERS",
        investor_type: "Institution",
        email: "privateequity@calpers.ca.gov",
        created_at: expect.any(String),
      });

      const investorInDb = await prisma.investor.findUnique({
        where: {
          id: body.id,
        },
      });

      expect(investorInDb).not.toBeNull();
      expect(investorInDb?.email).toBe("privateequity@calpers.ca.gov");
    });

    it("creates a family office investor and returns the API value with a space", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/investors",
        headers: {
          "content-type": "application/json",
        },
        payload: {
          name: "Smith Family Office",
          investor_type: "Family Office",
          email: "investments@smithfamily.com",
        },
      });

      expect(response.statusCode).toBe(201);

      expect(response.json()).toEqual({
        id: expect.stringMatching(UUID_REGEX),
        name: "Smith Family Office",
        investor_type: "Family Office",
        email: "investments@smithfamily.com",
        created_at: expect.any(String),
      });
    });

    it("returns 400 when required fields are missing", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/investors",
        headers: {
          "content-type": "application/json",
        },
        payload: {
          name: "CalPERS",
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it("returns 400 when investor_type is invalid", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/investors",
        headers: {
          "content-type": "application/json",
        },
        payload: {
          ...validCreateInvestorBody,
          investor_type: "Pension Fund",
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it("returns 400 when email is invalid", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/investors",
        headers: {
          "content-type": "application/json",
        },
        payload: {
          ...validCreateInvestorBody,
          email: "not-an-email",
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it("returns 409 when email already exists", async () => {
      await createInvestor();

      const response = await app.inject({
        method: "POST",
        url: "/investors",
        headers: {
          "content-type": "application/json",
        },
        payload: validCreateInvestorBody,
      });

      expect(response.statusCode).toBe(409);

      expect(response.json()).toEqual({
        error: {
          code: "CONFLICT",
          message: "Investor email already exists",
        },
      });
    });
  });
});