import { Type } from "@sinclair/typebox";

const EMAIL_PATTERN = "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$";

export const InvestorTypeSchema = Type.Union([
  Type.Literal("Individual"),
  Type.Literal("Institution"),
  Type.Literal("Family Office"),
]);

export const CreateInvestorBodySchema = Type.Object(
  {
    name: Type.String({ minLength: 1 }),
    investor_type: InvestorTypeSchema,
    email: Type.String({ pattern: EMAIL_PATTERN }),
  },
  {
    additionalProperties: false,
  }
);

export const InvestorResponseSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  investor_type: InvestorTypeSchema,
  email: Type.String(),
  created_at: Type.String(),
});

export const InvestorsResponseSchema = Type.Array(InvestorResponseSchema);