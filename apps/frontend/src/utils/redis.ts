import redis from '@/lib/redis'

export class RedisHelpers {
    /**
     * 
     * @param key Redis Token Name
     * @param value Token Value
     * @param expirationInSeconds Expiration time in seconds. If not provided, the key will not expire.
     */
    static async set(key: string, value: string, expirationInSeconds?: number) : Promise<string | null> {
        if (expirationInSeconds) {
            return await redis.setex(key, expirationInSeconds, value);
        } else {
            return await redis.set(key, value);
        }
    }

    /**
     * Retrieves a value from Redis by key.
     * @param key The key to retrieve the value for.
     * @returns The value associated with the key, or null if not found.
     */
    static async get(key: string): Promise<any> {
        return await redis.get(key);
    }

    /**
     * 
     * @param key Key to delete from Redis
     * @returns void
     */
    static async delete(key: string): Promise<number> {
        return await redis.del(key);
    }

    /**
     * Checks if a key exists in Redis.
     * @param key The key to check for existence.
     * @returns A boolean indicating whether the key exists.
     */
    static async has(key: string): Promise<boolean> {
        const exists = await redis.exists(key);
        return exists === 1;
    }
}