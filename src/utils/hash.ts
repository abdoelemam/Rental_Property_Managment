import bcrypt from "bcryptjs";

export const hashPassword = async (plaintext: string, salt: number = Number(process.env.SALT_ROUNDS) || 12) => {
    return bcrypt.hash(plaintext, salt);
}

export const comparePassword = async (plaintext: string, cipertext: string) => {
    return bcrypt.compare(plaintext, cipertext);
}