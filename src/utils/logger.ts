const redactedFields = [
    "token",
    "access_token",
    "refresh_token",
    "accessToken",
    "refreshToken",
    "bearer",
    "authorization",
    "Authorization",
    "code",
    "auth_code",
    "authCode",
    "client_secret",
    "clientSecret",
    "code_verifier",
    "codeVerifier",
    "code_challenge",
    "codeChallenge",
    "userid",
    "userId",
    "user_id",
    "email",
    "password",
    "sessionId",
    "session_id",
    "state",
    "apiKey",
    "api_key",
    "secret",
];

const LOG_LEVELS = {
    trace: 10,
    debug: 20,
    info: 30,
    warn: 40,
    error: 50,
} as const;

type LogLevel = keyof typeof LOG_LEVELS;

class Logger {
    private level: number;
    private context: Record<string, unknown>;

    constructor(context: Record<string, unknown> = {}) {
        const envLevel = (
            process.env.LOG_LEVEL || "info"
        ).toLowerCase() as LogLevel;
        this.level = LOG_LEVELS[envLevel] || LOG_LEVELS.info;
        this.context = context;
    }

    private redact(obj: any): any {
        if (typeof obj !== "object" || obj === null) return obj;
        if (Array.isArray(obj)) return obj.map((item) => this.redact(item));

        const redacted: any = {};
        for (const [key, value] of Object.entries(obj)) {
            if (redactedFields.includes(key)) {
                redacted[key] = "[REDACTED]";
            } else if (typeof value === "object" && value !== null) {
                redacted[key] = this.redact(value);
            } else {
                redacted[key] = value;
            }
        }
        return redacted;
    }

    private log(level: LogLevel, message: string, data?: unknown) {
        if (LOG_LEVELS[level] < this.level) return;

        const levelStr = level.toUpperCase().padEnd(5);
        const component = this.context.component
            ? `[${this.context.component}] `
            : "";
        let output = `${levelStr} ${component}${message}`;

        if (data) {
            output += ` ${JSON.stringify(this.redact(data))}`;
        }

        switch (level) {
            case "error":
                console.error(output);
                break;
            case "warn":
                console.warn(output);
                break;
            default:
                console.log(output);
        }
    }

    trace(message: string, data?: unknown) {
        this.log("trace", message, data);
    }
    debug(message: string, data?: unknown) {
        this.log("debug", message, data);
    }
    info(message: string, data?: unknown) {
        this.log("info", message, data);
    }
    warn(message: string, data?: unknown) {
        this.log("warn", message, data);
    }
    error(message: string, data?: unknown) {
        this.log("error", message, data);
    }

    child(context: Record<string, unknown>) {
        return new Logger({ ...this.context, ...context });
    }
}

export const logger = new Logger();

export function createLogger(context: Record<string, unknown>) {
    return logger.child(context);
}
