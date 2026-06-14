import { describe, expect, it } from "vitest";
import { Value } from "@sinclair/typebox/value";
import {
  CreateInvestmentBodySchema,
  FundIdParamsSchema,
} from "../../src/schemas/investment.schema";

describe("investment schemas", () => {
  describe("FundIdParamsSchema", () => {
    it("accepts a valid fund_id UUID", () => {
      expect(
        Value.Check(FundIdParamsSchema, {
          fund_id: "550e8400-e29b-41d4-a716-446655440000",
        })
      ).toBe(true);
    });

    it("rejects an invalid fund_id UUID", () => {
      expect(
        Value.Check(FundIdParamsSchema, {
          fund_id: "not-a-uuid",
        })
      ).toBe(false);
    });
  });

  describe("CreateInvestmentBodySchema", () => {
    it("accepts a valid investment body", () => {
      const body = {
        investor_id: "880e8400-e29b-41d4-a716-446655440003",
        amount_usd: 75000000,
        investment_date: "2024-09-22",
      };

      expect(Value.Check(CreateInvestmentBodySchema, body)).toBe(true);
    });

    it("rejects a missing investor_id", () => {
      const body = {
        amount_usd: 75000000,
        investment_date: "2024-09-22",
      };

      expect(Value.Check(CreateInvestmentBodySchema, body)).toBe(false);
    });

    it("rejects an invalid investor_id UUID", () => {
      const body = {
        investor_id: "not-a-uuid",
        amount_usd: 75000000,
        investment_date: "2024-09-22",
      };

      expect(Value.Check(CreateInvestmentBodySchema, body)).toBe(false);
    });

    it("rejects zero amount_usd", () => {
      const body = {
        investor_id: "880e8400-e29b-41d4-a716-446655440003",
        amount_usd: 0,
        investment_date: "2024-09-22",
      };

      expect(Value.Check(CreateInvestmentBodySchema, body)).toBe(false);
    });

    it("rejects negative amount_usd", () => {
      const body = {
        investor_id: "880e8400-e29b-41d4-a716-446655440003",
        amount_usd: -1,
        investment_date: "2024-09-22",
      };

      expect(Value.Check(CreateInvestmentBodySchema, body)).toBe(false);
    });

    it("rejects an invalid investment_date format", () => {
      const body = {
        investor_id: "880e8400-e29b-41d4-a716-446655440003",
        amount_usd: 75000000,
        investment_date: "22-09-2024",
      };

      expect(Value.Check(CreateInvestmentBodySchema, body)).toBe(false);
    });

    it("rejects unexpected extra fields", () => {
      const body = {
        investor_id: "880e8400-e29b-41d4-a716-446655440003",
        amount_usd: 75000000,
        investment_date: "2024-09-22",
        fund_id: "550e8400-e29b-41d4-a716-446655440000",
      };

      expect(Value.Check(CreateInvestmentBodySchema, body)).toBe(false);
    });
  });
});