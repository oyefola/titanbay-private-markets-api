import { describe, expect, it } from "vitest";
import { Value } from "@sinclair/typebox/value";
import { CreateInvestorBodySchema } from "../../src/schemas/investor.schema";

describe("investor schemas", () => {
  describe("CreateInvestorBodySchema", () => {
    it("accepts a valid institution investor", () => {
      const body = {
        name: "CalPERS",
        investor_type: "Institution",
        email: "privateequity@calpers.ca.gov",
      };

      expect(Value.Check(CreateInvestorBodySchema, body)).toBe(true);
    });

    it("accepts a valid individual investor", () => {
      const body = {
        name: "Jane Doe",
        investor_type: "Individual",
        email: "jane@example.com",
      };

      expect(Value.Check(CreateInvestorBodySchema, body)).toBe(true);
    });

    it("accepts a valid family office investor", () => {
      const body = {
        name: "Smith Family Office",
        investor_type: "Family Office",
        email: "investments@smithfamily.com",
      };

      expect(Value.Check(CreateInvestorBodySchema, body)).toBe(true);
    });

    it("rejects a missing name", () => {
      const body = {
        investor_type: "Institution",
        email: "privateequity@calpers.ca.gov",
      };

      expect(Value.Check(CreateInvestorBodySchema, body)).toBe(false);
    });

    it("rejects an empty name", () => {
      const body = {
        name: "",
        investor_type: "Institution",
        email: "privateequity@calpers.ca.gov",
      };

      expect(Value.Check(CreateInvestorBodySchema, body)).toBe(false);
    });

    it("rejects an invalid investor type", () => {
      const body = {
        name: "CalPERS",
        investor_type: "Pension Fund",
        email: "privateequity@calpers.ca.gov",
      };

      expect(Value.Check(CreateInvestorBodySchema, body)).toBe(false);
    });

    it("rejects an invalid email", () => {
      const body = {
        name: "CalPERS",
        investor_type: "Institution",
        email: "not-an-email",
      };

      expect(Value.Check(CreateInvestorBodySchema, body)).toBe(false);
    });

    it("rejects unexpected extra fields", () => {
      const body = {
        name: "CalPERS",
        investor_type: "Institution",
        email: "privateequity@calpers.ca.gov",
        extra: "not allowed",
      };

      expect(Value.Check(CreateInvestorBodySchema, body)).toBe(false);
    });
  });
});