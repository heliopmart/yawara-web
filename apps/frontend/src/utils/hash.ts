import bcryptjs from 'bcryptjs'
import crypto from 'crypto'

const TOKEN_SECRET_KEY = process.env.TOKEN_SECRET_KEY!!
const REPORT_HASH_SALT = process.env.REPORT_HASH_SALT || 'yawara_secret_salt';
const PASSWORD_HASH_SALT = process.env.PASSWORD_HASH_SALT || 'yawara_secret_salt';

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

export const handleGenerateHash = (payload: string): string => {
    
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(`${payload}${REPORT_HASH_SALT}`).digest('hex');
}

export const handleGeneratePasswordHash = (payload: string): string => {
    
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(`${payload}${PASSWORD_HASH_SALT}`).digest('hex');
}