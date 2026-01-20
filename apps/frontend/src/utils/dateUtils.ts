import { ps_card_configs } from '@yawara/types';

export const isEventWindowOpen = (cardConfig: ps_card_configs) => {
    if (!cardConfig.event_date) return true;

    const now = new Date();
    const eventDate = new Date(cardConfig.event_date);
    
    const isSameDay = now.toLocaleDateString() === eventDate.toLocaleDateString();
    if (!isSameDay) return false;

    if (cardConfig.event_times && cardConfig.event_times.length === 2) {
        const [startStr, endStr] = cardConfig.event_times;
        
        const parseTime = (timeStr: string) => {
            const [hours, minutes] = timeStr.replace('h', ':').split(':');
            const d = new Date(now);
            d.setHours(parseInt(hours), parseInt(minutes || '0'), 0);
            return d;
        };

        const startTime = parseTime(startStr);
        const endTime = parseTime(endStr);

        return now >= startTime && now <= endTime;
    }

    return true;
};