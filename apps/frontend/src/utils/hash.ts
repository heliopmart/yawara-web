import bcryptjs from 'bcryptjs'
import crypto from 'crypto'

const TOKEN_SECRET_KEY = process.env.TOKEN_SECRET_KEY!!

export const hashCreateSecretAuth = async (): Promise<string> => {
    return crypto.randomBytes(16).toString('hex');
}

export const hashPasswordString = async (str: string): Promise<string> => {
    const salt = await bcryptjs.genSalt(10);
    const hash = await bcryptjs.hash(str, salt);
    return hash;
}

export const verifyPasswordString = async (str: string, hash: string): Promise<boolean> => {
    const isMatch = await bcryptjs.compare(str, hash);
    return isMatch;
}

export const createToken = async (userSecret: string): Promise<string> => {
    return crypto.createHmac('sha256', TOKEN_SECRET_KEY).update(userSecret).digest('hex');
}