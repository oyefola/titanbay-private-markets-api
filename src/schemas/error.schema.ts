import { Type } from "@sinclair/typebox";


export const ErrorResponseSchema = Type.Object({
    error: Type.Object({
        code: Type.String(),
        message: Type.String(),
    }),
});
