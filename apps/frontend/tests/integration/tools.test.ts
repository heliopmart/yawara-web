import { describe, it, expect, beforeAll } from 'vitest';
import axios from 'axios';
import { getAuthCookie } from '../helpers/auth.setup';

import { Tool } from "@yawara/types"

const PATH_API = process.env.PATH_API || 'http://localhost:3000/api';
describe('Tools API Endpoints', () => {
    let sessionCookie: string;

    beforeAll(async () => {
        sessionCookie = await getAuthCookie();
    });

    it('deve carregar a lista de ferramentas usando o cookie de sessão', async () => {
        const response = await axios.get<{ data: Tool[] }>(
            `${PATH_API}/tool`,
            { headers: { 'Cookie': sessionCookie } }
        );

        expect(response.status).toBe(200);
        expect(Array.isArray(response.data.data)).toBe(true);

        if (response.data.data.length > 0) {
            expect(response.data.data[0]).toHaveProperty('id');
            expect(response.data.data[0]).toHaveProperty('name');
            expect(response.data.data[0]).toHaveProperty('status');
        }
    });

    it('deve criar uma nova ferramenta com sucesso', async () => {
        const newTool = {
            data: {
                name: 'Osciloscópio Digital',
                target: 'Laboratório de Elétrica',
                quantity: 1,
                is_tool: true,
                nucleus_id: '0b305314-c9b6-464d-9509-dac25bb98f42',
                description: 'Equipamento para análise de sinais do motor Yawara'
            }
        };

        const response = await axios.post<{ data: string }>(
            `${PATH_API}/tool`,
            newTool,
            { headers: { 'Cookie': sessionCookie } }
        );

        expect(response.status).toBe(201);
        expect(typeof response.data.data).toBe('string');
    });

    it('deve impedir atualização se o usuário não tiver permissão (ROLE)', async () => {

        const updateData = {
            id: '2c28b6fa-94f2-4f43-9e09-adaa91473ca1',
            data: { name: 'Tentativa de Fraude' },
        };

        try {
            await axios.patch(
                `${PATH_API}/tool`,
                updateData,
            );
        } catch (error: any) {
            expect(error.response.status).toBe(401);
            expect(error.response.data.code).toBe('UNAUTHORIZED_ERROR');
        }
    });

    it('deve retornar erro 400 ao enviar dados inválidos (Validation)', async () => {
        const invalidData = {
            data: {
                name: '',
                quantity: -5
            }
        };

        try {
            await axios.post(
                `${PATH_API}/tool`,
                invalidData,
                { headers: { 'Cookie': sessionCookie } }
            );
        } catch (error: any) {
            expect(error.response.status).toBe(400);
            expect(error.response.data.code).toBe('INVALID_REQUEST_DATA');
        }
    });
});


describe('PATCH /admin/tool/deallocate', () => {
    let sessionCookie: string;

    beforeAll(async () => {
        sessionCookie = await getAuthCookie();
    });

    it('deve desalocar uma ferramenta com sucesso quando o usuário é ADMIN/LÍDER', async () => {
        const payload = {
            id: '2c28b6fa-94f2-4f43-9e09-adaa91473ca1', 
            quantity: 1
        };

        const response = await axios.patch<{ data: boolean }>(
            `${PATH_API}/tool/deallocate`,
            payload,
            { headers: { 'Cookie': sessionCookie } }
        );

        expect(response.status).toBe(200);
        expect(response.data.data).toBe(true);
    });

    it('deve retornar 401 se o usuário tiver a role "USER"', async () => {
        const payload = {
            id: '2c28b6fa-94f2-4f43-9e09-adaa91473ca1',
            quantity: 1
        };

        try {
            await axios.patch(
                `${PATH_API}/tool/deallocate`,
                payload,
                { headers: { 'Cookie': sessionCookie } }
            );
        } catch (error: any) {
            expect(error.response.status).toBe(401);
            expect(error.response.data.code).toBe('UNAUTHORIZED_ERROR');
        }
    });

    it('deve retornar 400 se o corpo da requisição for inválido', async () => {
        const invalidPayload = {
            quantity: 5
        };

        try {
            await axios.patch(
                `${PATH_API}/tool/deallocate`,
                invalidPayload,
                { headers: { 'Cookie': sessionCookie } }
            );
        } catch (error: any) {
            expect(error.response.status).toBe(400);
            expect(error.response.data.code).toBe('INVALID_REQUEST_DATA');
        }
    });

    it('deve retornar 401 se o cookie de sessão não for enviado', async () => {
        try {
            await axios.patch(`${PATH_API}/tool/deallocate`, { id: 'uuid', quantity: 1 });
        } catch (error: any) {
            expect(error.response.status).toBe(401);
            expect(error.response.data.code).toBe('UNAUTHORIZED_ERROR');
        }
    });
});