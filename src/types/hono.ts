import type { Context, Next } from "hono";

export type AppEnv = {
    Variables: {
        accessToken: string;
    };
};

export type AppContext = Context<AppEnv>;
export type AppNext = Next;
