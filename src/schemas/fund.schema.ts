import { Type } from "@sinclair/typebox";

const UUID_PATTERN =
  "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$";

export const FundIdParamsSchema = Type.Object(
  {
    id: Type.String({ pattern: UUID_PATTERN }),
  },
  {
    additionalProperties: false,
  }
);

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
export const ErrorResponseSchema = Type.Object({
  error: Type.Object({
    code: Type.String(),
    message: Type.String(),
  }),
});
export const FundResponseSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  vintage_year: Type.Integer(),
  target_size_usd: Type.Number(),
  status: FundStatusSchema,
  created_at: Type.String(),
});
export const UpdateFundBodySchema = Type.Object(
  {
    id: Type.String({ pattern: UUID_PATTERN }),
    name: Type.String({ minLength: 1 }),
    vintage_year: Type.Integer({ minimum: 1900 }),
    target_size_usd: Type.Number({ exclusiveMinimum: 0 }),
    status: FundStatusSchema,
  },
  {
    additionalProperties: false,
  }
);
export const FundsResponseSchema = Type.Array(FundResponseSchema);