import { useState } from 'react';
import {CardConfig, EditionData} from '@yawara/types'

export const useEditionCreate = () => {
  const [edition, setEdition] = useState<EditionData>({
    name: '',
    start_date: '',
    finish_date: ''
  });

  const [cards, setCards] = useState<CardConfig[]>([
    { card_id: 1, deadline: '', event_date: '', event_location: '', event_times: ['', '']}
  ]);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleEditionChange = (field: keyof EditionData, value: string) => {
    setEdition(prev => ({ ...prev, [field]: value }));
  };

  const addCard = () => {
    setCards(prev => [
      ...prev,
      { 
        card_id: prev.length + 1,
        limit_date: '', 
        event_date: '', 
        event_location: '', 
        event_times: ['', '']
      }
    ]);
  };

  const removeCard = (index: number) => {
    if (cards.length === 1) return;
    setCards(prev => prev.filter((_, i) => i !== index));
  };

  const updateCard = (index: number, field: keyof CardConfig | 'start_time' | 'end_time', value: string) => {
    setCards(prev => {
      const newCards = [...prev];
      const card = { ...newCards[index] };
      
      const times = [...(card.event_times || ['', ''])];

      if (field === 'start_time') {
        times[0] = value;
        card.event_times = times;
      } else if (field === 'end_time') {
        times[1] = value;
        card.event_times = times;
      } else {
        // @ts-ignore
        card[field] = value;
      }
      
      newCards[index] = card;
      return newCards;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {      
      const cleanCards = cards.map(card => {
        const cleaned: Partial<CardConfig> = { card_id: card.card_id };

        if (card.deadline && card.deadline.trim() !== '') cleaned.deadline = card.deadline;
        if (card.event_date && card.event_date.trim() !== '') cleaned.event_date = card.event_date;
        if (card.event_location && card.event_location.trim() !== '') cleaned.event_location = card.event_location;

        const validTimes = card?.event_times?.filter(t => t && t.trim() !== '');
        
        if (validTimes.length > 0) {
            cleaned.event_times = validTimes;
        }

        return cleaned;
      });

      const payload = {
        name: edition.name,
        start_date: edition.start_date || null, 
        finish_date: edition.finish_date || null,
        cards_config: cleanCards
      };

      const response = await fetch('/api/admin/ps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      const responseData = data.data || data; 
      
      if (responseData.status === 'error' || data.success === false) {
        throw new Error(responseData.error?.message || responseData.error || 'Erro desconhecido no servidor.');
      }

      setMessage({ type: 'success', text: 'Processo Seletivo criado com sucesso!' });
      
    } catch (error: any) {
      console.error('Erro no create:', error);
      setMessage({ type: 'error', text: error.message || 'Falha ao conectar.' });
    } finally {
      setLoading(false);
    }
  };

  return {
    edition,
    cards,
    loading,
    message,
    handleEditionChange,
    addCard,
    removeCard,
    updateCard,
    handleSubmit
  };
};