import { useState, useEffect, useMemo, useCallback } from 'react';
import { DashboardPresenceResponse } from '@yawara/types';

export const usePresenceList = () => {
  const [data, setData] = useState<DashboardPresenceResponse | null>(null);

  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [pendingChanges, setPendingChanges] = useState<Map<string, boolean>>(new Map());

  // --- 1. FETCH DATA (RPC) ---
  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/ps/presence');
      const resJson = await response.json();

      if (resJson.success === false) {
        throw new Error(resJson.error?.message || 'Erro ao carregar dados.');
      }

      const dashboardData: DashboardPresenceResponse = resJson.data || resJson;
      setData(dashboardData);

      if (!selectedCardId && dashboardData.in_person_cards.length > 0) {
        setSelectedCardId(dashboardData.in_person_cards[0].card_id);
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Falha na conexão.');
    } finally {
      setLoading(false);
    }
  }, [selectedCardId]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // --- 2. DISPLAY LIST (A Mágica do Cruzamento de Dados) ---
  const displayList = useMemo(() => {
    if (!data || !selectedCardId) return [];

    return data.participants.map(p => {
      const cardProgress = p.progress.find(c => c.card_id === selectedCardId);
      const originalIsPresent = cardProgress?.state === 'COMPLETED';
      const isPending = pendingChanges.has(p.id);
      const finalIsPresent = isPending ? pendingChanges.get(p.id)! : originalIsPresent;
      const isDirty = isPending && (pendingChanges.get(p.id) !== originalIsPresent);

      return {
        id: p.id,
        name: p.name,
        is_present: finalIsPresent,
        is_dirty: isDirty,
        original_status: originalIsPresent
      };
    });
  }, [data, pendingChanges, selectedCardId]);

  // --- 3. OPTIONS DO DROPDOWN ---
  const availableCards = useMemo(() => {
    if (!data) return [];
    return data.in_person_cards.map(c => {
      const dateObj = c.date ? new Date(c.date) : new Date(NaN);
      const dateStr = !isNaN(dateObj.getTime())
        ? dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
        : 'Data indefinida';

      return {
        id: c.card_id,
        label: `Card ${c.card_id} | ${dateStr} - ${c.location}`
      };
    });
  }, [data]);

  // --- 4. ACTIONS ---

  const toggleLocalPresence = (userCardUuid: string, currentIsPresent: boolean) => {
    setPendingChanges(prev => {
      const newMap = new Map(prev);
      newMap.set(userCardUuid, !currentIsPresent);
      return newMap;
    });
  };

  const saveChanges = async () => {
    if (pendingChanges.size === 0 || !selectedCardId) return;
    setSaving(true);

    try {
      const updates = Array.from(pendingChanges.entries()).map(([uuid, isPresent]) => ({
        user_card_id: uuid,
        card_id: selectedCardId,
        is_presence: isPresent 
      }));

      const response = await fetch('/api/admin/ps/presence', {
        method: 'PATCH', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }) 
      });

      const resJson = await response.json();

      if (resJson.success === false) {
        throw new Error(resJson.error?.message);
      }

      setPendingChanges(new Map());
      await fetchDashboard();

    } catch (err: any) {
      alert(`Erro ao salvar: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const hasPendingChanges = useMemo(() => {
    return displayList.some(i => i.is_dirty);
  }, [displayList]);

  return {
    displayList,
    availableCards,
    selectedCardId,
    setSelectedCardId,
    toggleLocalPresence,
    saveChanges,
    hasPendingChanges,
    loading,
    saving,
    error
  };
};