import { createToken } from "@/utils/hash"
import { RedisHelpers } from "@/utils/redis"
import jwt from 'jsonwebtoken'
import { TokenPayload } from '@yawara/types'

const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET!!;

export class Token {
    /**
     * Generate a token and store it in Redis
     * @param payload TokenPayload
     * @return token string
     * @throws 'INTERNAL_SERVER_ERROR' | 'TOKEN_REDIS_INSERT_ERROR'
     */
    static async generateToken(payload: TokenPayload): Promise<string> {
        try {
            const token = await createToken(payload.secret);
            const supabaseToken = await this.createSupabaseToken(payload);

            const redisResponse = await Token.insertTokenInRedis({...payload, supabaseToken}, token);

            if (!redisResponse) {
                throw 'TOKEN_REDIS_INSERT_ERROR';
            }

            return token;
        } catch (error) {
            console.error('Token.generateToken error', error);
            throw 'INTERNAL_SERVER_ERROR';
        }
    }

    /**
     * Create Supabase JWT token
     * @param payload TokenPayload
     * @return Supabase JWT token string
     * @throws 'SUPABASE_TOKEN_CREATION_ERROR' | 'SUPABASE_JWT_SECRET_NOT_DEFINED'
     */
    static async createSupabaseToken(payload: TokenPayload): Promise<string> {
        try {
            const now = Math.floor(Date.now() / 1000);
            const supabasePayload = {
                sub: payload.user_id,
                role: 'authenticated',
                aud: 'authenticated',
                app_role: payload.role || 'user',
                iat: now,
                exp: now + 60 * 60
            };

            if (!SUPABASE_JWT_SECRET)
                throw 'SUPABASE_JWT_SECRET_NOT_DEFINED'

            const supabaseAccessToken = jwt.sign(supabasePayload, SUPABASE_JWT_SECRET);
            return supabaseAccessToken
        } catch (error) {
            console.error('Token.createSupabaseToken error', error);
            throw 'SUPABASE_TOKEN_CREATION_ERROR';
        }
    }

    /**
     * Verify if a token exists in Redis
     * @param token string
     * @return boolean
     * @throws 'TOKEN_NOT_EXIST'
     */
    static async verifyToken(token: string): Promise<boolean> {
        try {
            const hasSession = await RedisHelpers.has(`jwt:${token}`);
            return hasSession
        } catch (error) {
            console.error('Token.verifyToken error', error);
            throw 'TOKEN_NOT_EXIST';
        }
    }

    /**
     * Delete a token from Redis
     * @param token string
     * @return boolean
     * @throws 'INTERNAL_SERVER_ERROR'
     */
    static async delete(token: string): Promise<boolean> {
        try {
            const response = await RedisHelpers.delete(`jwt:${token}`);
            return response ? true : false;
        } catch (error) {
            console.error('Token.delete error', error);
            throw 'INTERNAL_SERVER_ERROR';
        }
    }

    /**
     * Insert a token into Redis with its payload
     * @param payload TokenPayload
     * @param token string
     * @return boolean
     */
    static async insertTokenInRedis(payload: TokenPayload , token: string): Promise<boolean> {
        const response = await RedisHelpers.set(`jwt:${token}`, JSON.stringify(payload), 60 * 60);
        return response ? true : false;
    }

    /**
     * Get a token's payload from Redis
     * @param token string
     * @return TokenPayload
     * @throws 'TOKEN_NOT_FOUND_IN_REDIS' | 'INTERNAL_SERVER_ERROR'
     */
    static async getTokenInRedis(token: string): Promise<TokenPayload> {
        try {
            const response = await RedisHelpers.get(`jwt:${token}`);

            if (!response || !response.user_id) {
                throw 'TOKEN_NOT_FOUND_IN_REDIS';
            }

            return response as TokenPayload;
        } catch (error) {
            console.error('Token.getTokenInRedis error', error);
            throw 'INTERNAL_SERVER_ERROR';
        }
    }
}