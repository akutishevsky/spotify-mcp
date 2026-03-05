import crypto from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const SALT_LENGTH = 32;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

function deriveKey(masterSecret: string, salt: Buffer): Buffer {
    return crypto.pbkdf2Sync(
        masterSecret,
        salt,
        ITERATIONS,
        KEY_LENGTH,
        "sha256"
    );
}

function getMasterSecret(): string {
    const secret = process.env.ENCRYPTION_SECRET;
    if (!secret) {
        throw new Error(
            "ENCRYPTION_SECRET environment variable is required. Generate one with: openssl rand -hex 32"
        );
    }
    if (secret.length < 32) {
        throw new Error(
            "ENCRYPTION_SECRET must be at least 32 characters long"
        );
    }
    return secret;
}

export function encrypt(plaintext: string): string {
    const masterSecret = getMasterSecret();
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = deriveKey(masterSecret, salt);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([
        cipher.update(plaintext, "utf8"),
        cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    const combined = Buffer.concat([salt, iv, tag, encrypted]);

    return combined.toString("base64");
}

export function decrypt(encryptedData: string): string {
    const masterSecret = getMasterSecret();
    const combined = Buffer.from(encryptedData, "base64");

    const salt = combined.subarray(0, SALT_LENGTH);
    const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const tag = combined.subarray(
        SALT_LENGTH + IV_LENGTH,
        SALT_LENGTH + IV_LENGTH + TAG_LENGTH
    );
    const encrypted = combined.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);

    const key = deriveKey(masterSecret, salt);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
    ]);

    return decrypted.toString("utf8");
}
