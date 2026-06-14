import { describe, expect, it } from "vitest";
import { Value } from "@sinclair/typebox/value";
import {
  CreateFundBodySchema,
  FundIdParamsSchema,
  UpdateFundBodySchema,
} from "../../src/schemas/fund.schema";

describe("fund schemas", () => {
  describe("CreateFundBodySchema", () => {
    it("accepts a valid fund create body", () => {
      const body = {
        name: "Titanbay Growth Fund I",
        vintage_year: 2024,
        target_size_usd: 250000000,
        status: "Fundraising",
      };

      expect(Value.Check(CreateFundBodySchema, body)).toBe(true);
    });

    it("rejects an invalid status", () => {
      const body = {
        name: "Titanbay Growth Fund I",
        vintage_year: 2024,
        target_size_usd: 250000000,
        status: "Raising Money",
      };

      expect(Value.Check(CreateFundBodySchema, body)).toBe(false);
    });

    it("rejects zero or negative target size", () => {
      const body = {
        name: "Titanbay Growth Fund I",
        vintage_year: 2024,
        target_size_usd: 0,
        status: "Fundraising",
      };

      expect(Value.Check(CreateFundBodySchema, body)).toBe(false);
    });

    it("rejects missing required fields", () => {
      const body = {
        name: "Titanbay Growth Fund I",
        status: "Fundraising",
      };

      expect(Value.Check(CreateFundBodySchema, body)).toBe(false);
    });
  });

  describe("UpdateFundBodySchema", () => {
    it("accepts a valid fund update body", () => {
      const body = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        name: "Titanbay Growth Fund I",
        vintage_year: 2024,
        target_size_usd: 300000000,
        status: "Investing",
      };

      expect(Value.Check(UpdateFundBodySchema, body)).toBe(true);
    });

    it("rejects a missing id", () => {
      const body = {
        name: "Titanbay Growth Fund I",
        vintage_year: 2024,
        target_size_usd: 300000000,
        status: "Investing",
      };

      expect(Value.Check(UpdateFundBodySchema, body)).toBe(false);
    });
  });

  describe("FundIdParamsSchema", () => {
    it("accepts a valid UUID id", () => {
      expect(
        Value.Check(FundIdParamsSchema, {
          id: "550e8400-e29b-41d4-a716-446655440000",
        })
      ).toBe(true);
    });

    it("rejects an invalid UUID id", () => {
      expect(
        Value.Check(FundIdParamsSchema, {
          id: "not-a-uuid",
        })
      ).toBe(false);
    });
  });
});