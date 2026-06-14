import { Type } from "@sinclair/typebox";

const UUID_PATTERN =
  "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$";

const DATE_PATTERN = "^\\d{4}-\\d{2}-\\d{2}$";

export const FundIdParamsSchema = Type.Object(
  {
    fund_id: Type.String({ pattern: UUID_PATTERN }),
  },
  {
    additionalProperties: false,
  }
);

export const CreateInvestmentBodySchema = Type.Object(
  {
    investor_id: Type.String({ pattern: UUID_PATTERN }),
    amount_usd: Type.Number({ exclusiveMinimum: 0 }),
    investment_date: Type.String({ pattern: DATE_PATTERN }),
  },
  {
    additionalProperties: false,
  }
);

export const InvestmentResponseSchema = Type.Object({
  id: Type.String(),
  investor_id: Type.String(),
  fund_id: Type.String(),
  amount_usd: Type.Number(),
  investment_date: Type.String(),
});

export const InvestmentsResponseSchema = Type.Array(InvestmentResponseSchema);