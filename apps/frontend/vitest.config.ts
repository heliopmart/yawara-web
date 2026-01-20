import { defineConfig } from 'vitest/config';
import path from 'path';
import dotenv from 'dotenv';

// Carrega o .env.test manualmente antes de definir a config
dotenv.config({ path: path.resolve(__dirname, '.env') });

export default defineConfig({
  test: {
    // 1. Permite usar 'describe', 'it', 'expect' globalmente sem importar em cada ficheiro
    globals: true,
    
    // For endpoints test using node, but if you test UI components, change to 'jsdom'.
    environment: 'node',
    
    // 3. Onde o Vitest deve procurar os teus ficheiros de teste
    include: ['tests/**/*.{test,spec}.ts'],
    
    // 4. Loading .env files automatically (very important for your token/key)
    env: {
        // put
    },

    testTimeout: 10000,
  },
  
  resolve: {
    alias: {
      // If your project uses paths like '@/services/api', configure here so Vitest doesn't get lost
      '@': path.resolve(__dirname, './src'),
    },
  },
});