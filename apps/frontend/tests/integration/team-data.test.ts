import { describe, it, expect, beforeAll } from 'vitest';
import axios from 'axios';
import { getAuthCookie } from '../helpers/auth.setup';

import { myTeamDataProps, TeamMember, TeamMemberMinify, ArtManageProps } from "@yawara/types"

const PATH_API = process.env.PATH_API || 'http://localhost:3000/api';

it('deve carregar os dados do time usando o cookie de sessão', async () => {
    const cookie = await getAuthCookie();

    const response = await axios.get<{
        data: {
            data: myTeamDataProps
        }
    }>(
        `${PATH_API}/admin/myTeam`,
        { headers: { 'Cookie': cookie } }
    );

    expect(response.status).toBe(200);

    const payload = response.data.data.data;

    expect(payload.art).toBeDefined();
    expect(Array.isArray(payload.art)).toBe(true);

    if (payload.art.length > 0) {
        expect(payload.art[0]).toHaveProperty('title');
        expect(payload.art[0].type).toBe('ART');
    }

    if (payload.arttc.length > 0) {
        expect(payload.arttc[0]).toHaveProperty('title');
        expect(payload.arttc[0].type).toBe('ARTTC');
    }

    console.log('✅ Integração com API de dados do myTeam bem-sucedida.');
});

describe('RPC: get_team_members', () => {
    let cookie: string;

    beforeAll(async () => {
        cookie = await getAuthCookie();
    });

    it('deve validar que os membros do time seguem a interface TeamMember', async () => {
        const response = await axios.get<{
            data: { data: TeamMember[] }
        }>(
            `${PATH_API}/admin/myTeam/manage/team`,
            { headers: { 'Cookie': cookie } }
        );

        expect(response.status).toBe(200);

        const members = response.data.data.data;

        expect(Array.isArray(members)).toBe(true);

        if (members.length > 0) {
            const member = members[0];

            expect(member.user).toHaveProperty('name');
            expect(member.n_social).toHaveProperty('proactivity');
            expect(member.n_tech).toHaveProperty('delivery');

            expect(typeof member.warnings).toBe('number');
            expect(member.semester_id).toMatch(/^\d{4}\.[12]$/);
        }
    });
});

describe('RPC: getMyTeamDataForNote: Team member that dont have art_id or arttc_id', () => {
    let cookie: string;

    beforeAll(async () => {
        cookie = await getAuthCookie();
    });

    it('deve validar que os membros do time seguem a interface TeamMemberMinify', async () => {
        try {
            const response = await axios.get<{
                data: TeamMemberMinify[]
            }>(
                `${PATH_API}/admin/myTeam/art/create`,
                { headers: { 'Cookie': cookie } }
            );

            expect(response.status).toBe(200); // 403 role !== DEVELOPMENT, but 200 if role LEADER

            if (response.status !== 200) {
                return;
            }

            const members = response.data.data;

            expect(Array.isArray(members)).toBe(true);

            if (members.length > 0) {
                const member = members[0];

                expect(member.user).toHaveProperty('name');
            }
        } catch (error: any) {
            expect(error.response.status).toBe(403);
        }
    });
});

describe('RPC: getArt return art data and yours arttc linked', () => {
    let cookie: string;

    beforeAll(async () => {
        cookie = await getAuthCookie();
    });

    it('deve garantir que a ART tenha as propriedades obrigatórias', async () => {

        const response = await axios.post<{
            data: { data: ArtManageProps }
        }>(
            `${PATH_API}/admin/myTeam/art`,
            { id: '215e8653-79cc-4f21-aaf7-960c325ce7ac' },
            { headers: { 'Cookie': cookie } }
        );

        const art = response.data.data.data;

        expect(art.arttc).toBeInstanceOf(Array);

        if (art.arttc.length > 0) {
            const item = art.arttc[0];
            expect(typeof item.code).toBe('string');
            expect(['PARTIAL', 'FINAL']).toContain(item.type);
        }
    });
});


describe('Ação: admin/art/create - Criar ART e Vincular Membros', () => {
    let cookie: string;

    const MOCK_NUCLEI_ID = '0b305314-c9b6-464d-9509-dac25bb98f42';
    const MOCK_MEMBERS = [
        '3a0eeeee-293d-4580-a132-b61b98f161bb'
    ];

    beforeAll(async () => {
        cookie = await getAuthCookie();
    });

    it('deve criar uma ART e retornar o ID com sucesso', async () => {
        const payload = {
            title: "Desenvolvimento do Sistema de Admissão Neural",
            description: "Criação da lógica de backend e RPCs para gestão de membros.",
            members: MOCK_MEMBERS,
            nuclei_id: MOCK_NUCLEI_ID
        };

        const response = await axios.post<{ data: string }>(
            `${PATH_API}/admin/myTeam/art/create`,
            payload,
            { headers: { 'Cookie': cookie } }
        );

        expect(response.status).toBe(200);

        const result = response.data.data;
        expect(result).toBeDefined();
        expect(typeof result).toBe('string');


        console.log(`✅ ART Criada:  ID: ${result}`);
    });
});

describe('Ação: admin/arttc/create - Criar ARTTC e Vincular por Team ID', () => {
    let cookie: string;

    const EXISTING_ART_ID = '215e8653-79cc-4f21-aaf7-960c325ce7ac';
    const TEAM_MEMBER_IDS = ['3a0eeeee-293d-4580-a132-b61b98f161bb'];

    beforeAll(async () => {
        cookie = await getAuthCookie();
    });

    it('deve criar uma ARTTC e vincular os membros corretamente', async () => {
        const payload = {
            title: "Pesquisa de componentes mais eficientes",
            description: "Análise de MOSFETs e drivers para a placa de comando.",
            members: TEAM_MEMBER_IDS,
            art_id: EXISTING_ART_ID,
            type: 'PARTIAL'
        };

        const response = await axios.post<{ data: string }>(
            `${PATH_API}/admin/myTeam/arttc/create`,
            payload,
            { headers: { 'Cookie': cookie } }
        );

        expect(response.status).toBe(200);
        const result = response.data.data;

        expect(result).toBe("string")

        console.log(`✅ ARTTC Criada: ${result} vinculada à ART: ${EXISTING_ART_ID}`);
    });
});

it('deve executar o banimento completo: status, role, notas e bloqueio', async () => {
    const cookie = await getAuthCookie();
    const TARGET_TEAM_ID = '3a0eeeee-293d-4580-a132-b61b98f161bb';

    const response = await axios.patch(`${PATH_API}/admin/myTeam/manage/team/ban`,
        { team_id: TARGET_TEAM_ID },
        { headers: { 'Cookie': cookie } }
    );

    expect(response.status).toBe(200);
    expect(response.data.status).toBe(true);

    const checkres = await axios.get<{
        data: { data: TeamMember[] }
    }>(
        `${PATH_API}/admin/myTeam/manage/team`,
        { headers: { 'Cookie': cookie } }
    );

    const members = checkres.data.data.data;

    const bannedMember = members.find(m => m.id === TARGET_TEAM_ID);

    if (bannedMember) {
        expect(bannedMember.warnings).toBe(3);
        expect(bannedMember.role).toBe('NULL');
        expect(bannedMember.n_tech.delivery).toBe(0);
    }
});

it('deve lançar notas do semestre e marcar como postado na tabela team', async () => {
    const cookie = await getAuthCookie();
    const TEAM_ID = 'a6dd2afc-7a82-47ad-b013-12204e8e12ce';

    const social_notes = { proactivity: 10, participation: 9 };
    const tech_notes = { reports: 8, delivery: 10 };

    const response = await axios.post(`${PATH_API}/admin/myTeam/manage/team/score`, {
        team_id: TEAM_ID,
        n_social: social_notes,
        n_tech: tech_notes
    }, { headers: { 'Cookie': cookie } });

    expect(response.status).toBe(200);
    expect(response.data.data).toBe(true);

    const checkres = await axios.get<{
        data: { data: TeamMember[] }
    }>(
        `${PATH_API}/admin/myTeam/manage/team`,
        { headers: { 'Cookie': cookie } }
    );

    const member = checkres.data.data.data.find(m => m.id === TEAM_ID);
    expect(member?.posted_notes).toBe(true);
});