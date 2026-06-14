import { Type } from "@sinclair/typebox";

export const FundStatusSchema = Type.Union([
  Type.Literal("Fundraising"),
  Type.Literal("Investing"),
  Type.Literal("Closed"),
]);

export const CreateFundBodySchema = Type.Object(
  {
    name: Type.String({ minLength: 1 }),
    vintage_year: Type.Integer({ minimum: 1900 }),
    target_size_usd: Type.Number({ exclusiveMinimum: 0 }),
    status: FundStatusSchema,
  },
  {
    additionalProperties: false,
  }
);

export const FundResponseSchema = Type.Object({
  id: Type.String({ format: "uuid" }),
  name: Type.String(),
  vintage_year: Type.Integer(),
  target_size_usd: Type.Number(),
  status: FundStatusSchema,
  created_at: Type.String({ format: "date-time" }),
});

export const FundsResponseSchema = Type.Array(FundResponseSchema);