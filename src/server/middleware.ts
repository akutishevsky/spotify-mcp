import { tokenStore } from "../auth/token-store.ts";
import { createLogger } from "../utils/logger.ts";
import type { AppContext, AppNext } from "../types/hono.ts";

const logger = createLogger({ component: "middleware" });

export const authenticateBearer = async (c: AppContext, next: AppNext) => {
    const authHeader = c.req.header("Authorization");
    const path = c.req.path;
    const method = c.req.method;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        logger.warn(
            `Authentication failed on ${method} ${path}: missing or invalid authorization header`
        );
        return c.json(
            {
                error: "unauthorized",
                error_description: "Bearer token required",
            },
            401
        );
    }

    const token = authHeader.substring(7);
    const isValid = await tokenStore.isValid(token);
    if (!isValid) {
        logger.warn(
            `Authentication failed on ${method} ${path}: invalid or expired token`
        );
        return c.json(
            {
                error: "invalid_token",
                error_description: "Token is invalid or expired",
            },
            401
        );
    }

    logger.info(`Authenticated request: ${method} ${path}`);
    c.set("accessToken", token);
    await next();
};
