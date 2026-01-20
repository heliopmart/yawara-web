import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArtsGridProps, ArttcsGridProps, NoteState, TeamMemberMinify, ArtMinify, ArtManageProps } from '@yawara/types'
import { useUserRole } from './useUserRole'

import { TeamMember, ScoreCategory } from '@yawara/types';



export const useMyTeam = () => {
    const { role, isLoading, user } = useUserRole();
    const [isLeader, setIsLeader] = useState(false);

    const [newsWall, setNewsWall] = useState([]);
    const [taskWall, setTaskWall] = useState([]);
    const [artGrid, setArtGrid] = useState<ArtsGridProps[]>([]);
    const [arttcsGrid, setArttcsGrid] = useState<ArttcsGridProps[]>([]);

    useEffect(() => {
        setIsLeader(role === 'LEADER' || role === 'MODERATOR');
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

    const [isSemesterEnd, setIsSemesterEnd] = useState(false);

    useEffect(() => {
        setIsManager(role === 'ADMIN' || role === 'LEADER');
    }, [role]);

    const handleFetchTeam = async () => {

    }

    const handleSubmitScores = async () => {
        
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

    const createNewWarnings = (memberId: string) => {
        // TODO: create alert and API call
    }

    const banUser = (memberId: string) => {
        // TODO: create alert and API call
    }

    return {
        role,
        user,

        isLoading,
        isSemesterEnd,
        isManager,

        team,
        setTeam,

        handleScoreUpdate,
        createNewWarnings,
        banUser
    }
}

export const useAddNote = (type: string) => {
    const router = useRouter();
    const [note, setNote] = useState<NoteState>({
        type: 'ART',
        title: '',
        description: '',
        members: []
    });
    const [arts, setArts] = useState<ArtMinify[]>([]);
    const [filterText, setFilterText] = useState<string>('');
    const [filtered, setFiltered] = useState<TeamMemberMinify[]>();
    const [teamMembers, setTeamMembers] = useState<TeamMemberMinify[]>([]);
    const [allocatedMembers, setAllocatedMembers] = useState<TeamMemberMinify[]>([]);
    const [file, setFile] = useState<File | null>(null);

    // ==================== HANDLE ====================

    const handleGet = async () => {
        // TODO: API CALL to get team members

    }

    const handleAllocateMember = (memberId: TeamMemberMinify['id']) => {
        setAllocatedMembers(prev => {
            if (prev.find(member => member.id === memberId)) {
                return prev.filter(member => member.id !== memberId);
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
        } else {
            if (note.description?.length === 0) {
                return false;
            }
        }

        if (note && (note.title?.length === 0)) {
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

    // ================= SUBMIT ===================

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if(!handleFormValidation()) return;



        // TODO: API CALL

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

export const useManageArt = (id : string) => {
    const router = useRouter();
    const [art, setArt] = useState<ArtManageProps>();
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false)

    // ==================== HANDLE ====================

    const handleGet = () => {

    }

    const handleDonwload = (download_id: string) => {

    }

    const handleUploadReport = (type: 'PARTIAL' | 'FINAL') => {
        if(!file){
            return;
        }


    }

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
        handleDonwload,
        handleUploadReport
    }
}