import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { FastifyInstance } from "fastify";
import { buildApp } from "../../src/app";
import { prisma } from "../../src/db";

const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;

const missingFundId = "550e8400-e29b-41d4-a716-446655449999";
const missingInvestorId = "880e8400-e29b-41d4-a716-446655449999";

async function createFund() {
  return prisma.fund.create({
    data: {
      name: "Titanbay Growth Fund I",
      vintage_year: 2024,
      target_size_usd: 250000000,
      status: "Fundraising",
    },
  });
}

async function createInvestor() {
  return prisma.investor.create({
    data: {
      name: "CalPERS",
      investor_type: "Institution",
      email: "privateequity@calpers.ca.gov",
    },
  });
}

async function createInvestment(fundId: string, investorId: string) {
  return prisma.investment.create({
    data: {
      fund_id: fundId,
      investor_id: investorId,
      amount_usd: 75000000,
      investment_date: new Date("2024-09-22"),
    },
  });
}

describe("investment routes", () => {
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

  describe("GET /funds/:fund_id/investments", () => {
    it("returns an empty array when the fund exists but has no investments", async () => {
      const fund = await createFund();

      const response = await app.inject({
        method: "GET",
        url: `/funds/${fund.id}/investments`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual([]);
    });

    it("returns investments for a fund", async () => {
      const fund = await createFund();
      const investor = await createInvestor();

      await createInvestment(fund.id, investor.id);

      const response = await app.inject({
        method: "GET",
        url: `/funds/${fund.id}/investments`,
      });

      expect(response.statusCode).toBe(200);

      const body = response.json();

      expect(body).toHaveLength(1);
      expect(body[0]).toEqual({
        id: expect.stringMatching(UUID_REGEX),
        investor_id: investor.id,
        fund_id: fund.id,
        amount_usd: 75000000,
        investment_date: "2024-09-22",
      });
    });

    it("returns 400 when fund_id is not a UUID", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/funds/not-a-uuid/investments",
      });

      expect(response.statusCode).toBe(400);
    });

    it("returns 404 when the fund does not exist", async () => {
      const response = await app.inject({
        method: "GET",
        url: `/funds/${missingFundId}/investments`,
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

  describe("POST /funds/:fund_id/investments", () => {
    it("creates an investment for an existing fund and investor", async () => {
      const fund = await createFund();
      const investor = await createInvestor();

      const response = await app.inject({
        method: "POST",
        url: `/funds/${fund.id}/investments`,
        headers: {
          "content-type": "application/json",
        },
        payload: {
          investor_id: investor.id,
          amount_usd: 75000000,
          investment_date: "2024-09-22",
        },
      });

      expect(response.statusCode).toBe(201);

      const body = response.json();

      expect(body).toEqual({
        id: expect.stringMatching(UUID_REGEX),
        investor_id: investor.id,
        fund_id: fund.id,
        amount_usd: 75000000,
        investment_date: "2024-09-22",
      });

      const investmentInDb = await prisma.investment.findUnique({
        where: {
          id: body.id,
        },
      });

      expect(investmentInDb).not.toBeNull();
      expect(investmentInDb?.fund_id).toBe(fund.id);
      expect(investmentInDb?.investor_id).toBe(investor.id);
    });

    it("uses fund_id from the URL path, not the request body", async () => {
      const fund = await createFund();
      const investor = await createInvestor();

      const response = await app.inject({
        method: "POST",
        url: `/funds/${fund.id}/investments`,
        headers: {
          "content-type": "application/json",
        },
        payload: {
          investor_id: investor.id,
          amount_usd: 75000000,
          investment_date: "2024-09-22",
        },
      });

      expect(response.statusCode).toBe(201);
      expect(response.json().fund_id).toBe(fund.id);
    });

    it("returns 400 when fund_id is not a UUID", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/funds/not-a-uuid/investments",
        headers: {
          "content-type": "application/json",
        },
        payload: {
          investor_id: "880e8400-e29b-41d4-a716-446655440003",
          amount_usd: 75000000,
          investment_date: "2024-09-22",
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it("returns 404 when the fund does not exist", async () => {
      const investor = await createInvestor();

      const response = await app.inject({
        method: "POST",
        url: `/funds/${missingFundId}/investments`,
        headers: {
          "content-type": "application/json",
        },
        payload: {
          investor_id: investor.id,
          amount_usd: 75000000,
          investment_date: "2024-09-22",
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

    it("returns 404 when the investor does not exist", async () => {
      const fund = await createFund();

      const response = await app.inject({
        method: "POST",
        url: `/funds/${fund.id}/investments`,
        headers: {
          "content-type": "application/json",
        },
        payload: {
          investor_id: missingInvestorId,
          amount_usd: 75000000,
          investment_date: "2024-09-22",
        },
      });

      expect(response.statusCode).toBe(404);

      expect(response.json()).toEqual({
        error: {
          code: "NOT_FOUND",
          message: "Investor not found",
        },
      });
    });

    it("returns 400 when investor_id is not a UUID", async () => {
      const fund = await createFund();

      const response = await app.inject({
        method: "POST",
        url: `/funds/${fund.id}/investments`,
        headers: {
          "content-type": "application/json",
        },
        payload: {
          investor_id: "not-a-uuid",
          amount_usd: 75000000,
          investment_date: "2024-09-22",
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it("returns 400 when amount_usd is not positive", async () => {
      const fund = await createFund();
      const investor = await createInvestor();

      const response = await app.inject({
        method: "POST",
        url: `/funds/${fund.id}/investments`,
        headers: {
          "content-type": "application/json",
        },
        payload: {
          investor_id: investor.id,
          amount_usd: 0,
          investment_date: "2024-09-22",
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it("returns 400 when investment_date has invalid format", async () => {
      const fund = await createFund();
      const investor = await createInvestor();

      const response = await app.inject({
        method: "POST",
        url: `/funds/${fund.id}/investments`,
        headers: {
          "content-type": "application/json",
        },
        payload: {
          investor_id: investor.id,
          amount_usd: 75000000,
          investment_date: "22-09-2024",
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it("returns 400 when required fields are missing", async () => {
      const fund = await createFund();

      const response = await app.inject({
        method: "POST",
        url: `/funds/${fund.id}/investments`,
        headers: {
          "content-type": "application/json",
        },
        payload: {
          amount_usd: 75000000,
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });
});