import { ps_card_configs } from '@yawara/types';

export const isEventWindowOpen = (cardConfig: ps_card_configs): boolean => {    
    if (!cardConfig.event_date) return true;

    const now = new Date();
    
    const eventDate = new Date(cardConfig.event_date);
    
    const isToday = 
        now.getUTCFullYear() === eventDate.getUTCFullYear() &&
        now.getUTCMonth() === eventDate.getUTCMonth() &&
        now.getUTCDate() === eventDate.getUTCDate();



    if (!isToday) return false;

    if (cardConfig.start_time && cardConfig.end_time) {
        const startTime = new Date(cardConfig.start_time);
        const endTime = new Date(cardConfig.end_time);

        return now.getTime() >= startTime.getTime() && now.getTime() <= endTime.getTime();
    }

    return true;
};