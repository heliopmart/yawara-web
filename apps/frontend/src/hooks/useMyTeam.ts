import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArtsGridProps, ArttcsGridProps, NoteState, TeamMemberMinify, ArtMinify, ArtManageProps, ArttcManageProps } from '@yawara/types'
import { useUserRole } from './useUserRole'

import { TeamMember, ScoreCategory } from '@yawara/types';

export const useMyTeam = () => {
    const { role, isLoading, user } = useUserRole();
    const [isLeader, setIsLeader] = useState(false);

    const [newsWall, setNewsWall] = useState([]);
    const [taskWall, setTaskWall] = useState([]);
    const [artGrid, setArtGrid] = useState<ArtsGridProps[]>([]);
    const [arttcsGrid, setArttcsGrid] = useState<ArttcsGridProps[]>([]);

    const handleFetchTeam = async () => {
        try {
            const res = await fetch('/api/admin/myTeam', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!res.ok) {
                return
            }

            const data = await res.json();
            const payload = data.data.data;

            setNewsWall(payload.newsWall || []);
            setTaskWall(payload.taskWall || []);
            setArtGrid(payload.art || []);
            setArttcsGrid(payload.arttc || []);

        } catch (error) {
            console.error("Error fetching team data:", error);
        }
    }

    useEffect(() => {
        handleFetchTeam();
    }, [])

    useEffect(() => {
        setIsLeader(role === 'LEADER' || role === 'MODERATOR' || role === 'DEVELOPER');
    }, [role]);

    return {
        role,
        isLoading,
        user,

        arttcsGrid,
        artGrid,
        taskWall,
        newsWall,

        isLeader
    }
}

export const useManagerTeam = () => {
    const { role, isLoading, user } = useUserRole();
    const [isManager, setIsManager] = useState(false);
    const [team, setTeam] = useState<TeamMember[]>([]);

    const [isSemesterEnd, setIsSemesterEnd] = useState(true);

    useEffect(() => {
        setIsManager(role === 'ADMIN' || role === 'LEADER' || role === 'DEVELOPER');
    }, [role]);

    const handleFetchTeam = async () => {
        try {
            const res = await fetch('/api/admin/myTeam/manage/team', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!res.ok) {
                return;
            }

            const data = await res.json();
            const payload = data.data.data;
            setTeam(payload);

            // ? Frontend viewer only, the backend has policies to block any requests
            setIsSemesterEnd(handleSemesterEnd())
        } catch (error) {
            console.error("Error fetching team data:", error);
        }
    }

    const handleSemesterEnd = () => {
        const data = new Date();
        const month = data.getMonth() + 1;
        if ([7, 11].includes(month)) {
            return true;
        }

        return false
    }

    const handleSubmitScores = async (team_id: string) => {
        try {
            const member = team.find(m => m.id === team_id);

            const res = await fetch('/api/admin/myTeam/manage/team/score', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    team_id: team_id,
                    n_social: JSON.stringify(member?.n_social),
                    n_tech: JSON.stringify(member?.n_tech)
                })
            });

            if (!res.ok) {
                alert("Erro ao atualizar nota do membro.")
                return
            }

            const data = await res.json();

            if (!data.sucess) {
                alert("Permissão negada.")
            }

            alert("Notas atualizadas com sucesso.");
            return data.status;
        } catch (error) {
            console.error("Error submitting scores:", error);
        }
    }

    const handleScoreUpdate = (
        memberId: string,
        category: ScoreCategory,
        key: string,
        value: number
    ) => {
        if (!isSemesterEnd) return;

        setTeam(prev => prev.map(m => {
            if (m.id === memberId) {
                return {
                    ...m,
                    [category]: {
                        ...m[category],
                        [key]: value
                    }
                };
            }
            return m;
        }));
    };

    const createNewWarnings = async (team_id: string) => {
        try {
            const res = await fetch('/api/admin/myTeam/manage/team/warning', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    team_id
                })
            });

            if (!res.ok) {
                alert("Erro ao criar novo aviso.");
                return
            }

            const data = await res.json();
            if (!data.sucess) {
                alert("Permissão negada.")
                return;
            }

            alert("Warning criado com sucesso.");
        } catch (error) {
            console.error("Error creating new warning:", error);
        }
    }

    const banUser = async (team_id: string) => {
        try {
            const ok = confirm("Tem certeza que deseja banir este usuário? Essa ação é inreversivel!");
            if (!ok) {
                return
            }

            const res = await fetch('/api//admin/myTeam/manage/team/ban', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    team_id
                })
            });

            if (!res.ok) {
                alert("Erro Interno ao banir. Rollback.");
                return
            }

            const data = await res.json();
            if (!data.sucess) {
                alert("Permissão negada.")
                return;
            }

            alert("Warning criado com sucesso.");

        } catch (error) {
            console.error("Error banning user:", error);
        }
    }


    useEffect(() => {
        handleFetchTeam()
    }, [])

    return {
        role,
        user,

        isLoading,
        isSemesterEnd,
        isManager,

        team,
        setTeam,

        handleScoreUpdate,
        handleSubmitScores,
        createNewWarnings,
        banUser
    }
}

// TODO: Precisamos passar o documento em um verificador, para validar se o documento segue os padrões estabelecidos pelo YAWARA
export const useAddNote = (type: NoteState['type']) => {
    const router = useRouter();
    const [note, setNote] = useState<NoteState>({
        type: type,
        title: '',
        description: '',
        members: [],
        art: ''
    });
    const [arts, setArts] = useState<ArtMinify[]>([]);
    const [filterText, setFilterText] = useState<string>('');
    const [filtered, setFiltered] = useState<TeamMemberMinify[]>();
    const [teamMembers, setTeamMembers] = useState<TeamMemberMinify[]>([]);
    const [allocatedMembers, setAllocatedMembers] = useState<TeamMemberMinify[]>([]);
    const [file, setFile] = useState<File | null>(null);

    // ==================== HANDLE ====================

    const handleGet = async () => {
        if (type == 'ART') {
            try {
                const res = await fetch('/api/admin/myTeam/art/create', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (!res.ok) {
                    throw "INTERNAL_SERVER_ERROR"
                }

                const data = await res.json();

                if (!data.success) {
                    throw "PERMISSION_DENIED"
                }

                setTeamMembers(data.data.team)
                setFiltered(data.data.team)
            } catch (error) {
                console.error("Error fetching team members or arts:", error);
            }
        } else {
            try {
                const res = await fetch('/api/admin/myTeam/arttc/create', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (!res.ok) {
                    throw "INTERNAL_SERVER_ERROR"
                }

                const data = await res.json();

                if (!data.success) {
                    throw "PERMISSION_DENIED"
                }

                setTeamMembers(data.data.team)
                setFiltered(data.data.team)
                setArts(data.data.arts)
            } catch (error) {
                console.error("Error fetching team members or arts:", error);
            }
        }
    }

    const handleAllocateMember = (memberId: TeamMemberMinify['id']) => {
        setAllocatedMembers(prev => {
            if (prev.find(member => member.id === memberId)) {
                const filtered = prev.filter(member => member.id !== memberId);
                return filtered;
            } else {
                const memberToAdd = teamMembers.find(member => member.id === memberId);
                return memberToAdd ? [...prev, memberToAdd] : prev;
            }
        });
    }

    const handleExcludeAllocatedMembers = (memberId: TeamMemberMinify['id']) => {
        setAllocatedMembers(prev => prev.filter(member => member.id !== memberId));
    }

    const handleFilteredMembers = () => {
        if (!filterText) {
            setFiltered(teamMembers);
            return;
        }
        setFiltered(teamMembers.filter(m =>
            m.user.name.toLowerCase().includes(filterText.toLowerCase())
        ));
    }

    const handleArtChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;

        setNote(prev => {
            if (!prev) return prev;

            return {
                ...prev,
                art: value
            };
        });
    };

    const handleFormValidation = () => {
        if (type === 'ARTTC') {
            if (note.art?.length === 0) {
                return false;
            }
        }

        if (note && (note.title?.length === 0 || note.description?.length === 0)) {
            alert("Por favor, preencha todos os campos obrigatórios.");
            return false;
        }

        if (allocatedMembers.length === 0) {
            alert("Por favor, aloque pelo menos um membro da equipe.");
            return false;
        }

        if (file === null) {
            alert("Por favor, anexe o arquivo da ART.");
            return false;
        }

        return true
    }

    // ================= FILE ====================

    const handleUploadFile = async (note_id: string) => {
        if (!file) {
            return;
        }

        if (type === 'ART') {
            try {
                const formData = new FormData();
                formData.append('id', note_id);
                formData.append('file', file);

                const res = await fetch('/api/admin/myTeam/art/upload', {
                    method: 'POST',
                    body: formData,
                });

                const data = await res.json();
                if (!data.success) {
                    throw data.error
                }

                return true
            } catch (error) {
                console.error("Error submitting ART:", error);
            }
        } else {
            try {
                const formData = new FormData();
                formData.append('id', note_id);
                formData.append('file', file);

                const res = await fetch('/api/admin/myTeam/arttc/upload/file', {
                    method: 'POST',
                    body: formData,
                });

                const data = await res.json();
                if (!data.success) {
                    throw data.error
                }

                return true
            } catch (error) {
                console.error("Error submitting ARTTC:", error);
            }
        }
    }

    // ================= SUBMIT ===================

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!handleFormValidation()) return;

        if (type === 'ART') {
            try {
                const res = await fetch('/api/admin/myTeam/art/create', {
                    method: 'POST',
                    body: JSON.stringify({
                        title: note.title,
                        description: note.description,
                        members: allocatedMembers.map(m => m.id)
                    }),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (!res.ok) {
                    throw "INTERNAL_SERVER_ERROR"
                }

                const data = await res.json()
                if (!data.success) {
                    throw "PERMISSION_DENIED"
                }

                const note_id = data.data;

                await handleUploadFile(note_id)

                alert("ART criada com sucesso!");
                router.back()
            } catch (error) {
                console.error("Error submitting ART:", error);
            }

        } else {
            try {
                const res = await fetch('/api/admin/myTeam/arttc/create', {
                    method: 'POST',
                    body: JSON.stringify({
                        title: note.title,
                        description: note.description,
                        members: allocatedMembers.map(m => m.id),
                        art_id: note?.art
                    }),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (!res.ok) {
                    throw "INTERNAL_SERVER_ERROR"
                }

                const data = await res.json()
                if (!data.success) {
                    throw "PERMISSION_DENIED"
                }

                const note_id = data.data;

                await handleUploadFile(note_id)

                alert("ART criada com sucesso!");
                router.back()
            } catch (error) {
                console.error("Error submitting ART:", error);
            }
        }
    };

    // ==================== USE EFFECT =====================

    useEffect(() => {
        handleFilteredMembers()
    }, [filterText])

    useEffect(() => {
        handleGet()
    }, []);

    return {
        router,
        note,
        filtered,
        teamMembers,
        filterText,
        allocatedMembers,
        file,

        arts,

        handleFilteredMembers,
        handleAllocateMember,
        handleExcludeAllocatedMembers,
        setNote,
        setFilterText,
        setFile,

        handleSubmit,
        handleArtChange

    }
}

export const useManageArt = () => {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [art, setArt] = useState<ArtManageProps>();
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false)

    // ==================== HANDLE ====================

    const handleGet = async () => {
        try {
            setLoading(true)
            const res = await fetch(`/api/admin/myTeam/art`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id: id
                })
            });

            if (!res.ok) {
                throw "INTERNAL_SERVER_ERROR"
            }

            const data = await res.json()

            if (!data.success) {
                throw data.error
            }

            setArt(data.data.data)
        } catch (err) {
            console.error("Error fetching ART data:", err);
        } finally {
            setLoading(false)
        }
    }

    // TODO Testar funcionalidade
    const handleDownload = (public_id: string, title: string, type: 'ART' | 'ARTTC') => {
        return handleDownloadFile(public_id, title)
    };


    // ==================== USE EFFECT =====================

    useEffect(() => {
        handleGet()
    }, []);

    return {
        router,
        art,
        file,
        loading,

        setFile,
        handleDownload
    }
}

export const useManageArttc = () => {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [arttc, setArttc] = useState<ArttcManageProps>();
    const [uploading, setUploading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false)

    // ==================== HANDLE ====================

    const handleGet = async () => {
        try {
            setLoading(true)
            const res = await fetch(`/api/admin/myTeam/arttc`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id: id
                })
            });

            if (!res.ok) {
                throw "INTERNAL_SERVER_ERROR"
            }

            const data = await res.json()

            if (!data.success) {
                throw data.error
            }

            setArttc(data.data.data)
        } catch (err) {
            console.error("Error fetching ART data:", err);
        } finally {
            setLoading(false)
        }
    }

    const handleDownload = (download_id: string | undefined) => {
        return handleDownloadFile(download_id, `relatorio_${arttc?.title}` || 'relatorio_yawara');
    }

    const handleUploadReport = async () => {
        if (!file) {
            return;
        }

        setUploading(true)
        try {
            const formData = new FormData();
            formData.append('id', id);
            formData.append('file', file);

            const res = await fetch('/api/admin/myTeam/arttc/upload/report', {
                method: 'POST',
                body: formData,
            });

            if(!res.ok) {
                throw "INTERNAL_SERVER_ERROR"
            }

            const data = await res.json()
            if(!data.success){
                throw data.error
            }

            if(!data.data){
                alert("Você não está alocado nessa ARTTC, não é possível enviar o relatório.");
                return;
            }

            alert("Relatório enviado com sucesso!");
        } catch (error) {
            console.error("Error uploading report file:", error);
        } finally {
            setUploading(false)
        }
    }

    // ==================== USE EFFECT =====================

    useEffect(() => {
        handleGet()
    }, []);

    return {
        router,
        arttc,
        file,
        loading,
        uploading,

        setFile,
        handleDownload,
        handleUploadReport
    }
}

async function handleDownloadFile(public_id: string | undefined, title: string): Promise<void> {
    if (!public_id) return;
    
    const safeName = encodeURIComponent(title.replace(/\s+/g, '_'));

    window.location.href = `/api/admin/myTeam/file_download?publicId=${public_id}&name=${safeName}`;
}