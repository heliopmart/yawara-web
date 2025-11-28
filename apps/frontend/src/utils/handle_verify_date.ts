export const handle_verify_date = (dateString: string | null, time: number): boolean => {
    if( !dateString ){
        return false
    }
    
    const now = new Date();
    const disabledDate = new Date(dateString);

    const timeDifference = now.getTime() - disabledDate.getTime();

    if (timeDifference > time) {
        console.log('Já se passaram mais de 30 dias.');
        return true
    } else {
        const daysLeft = Math.ceil((time - timeDifference) / (1000 * 60 * 60 * 24));
        console.info(`Ainda não passaram 30 dias. Faltam ${daysLeft} dias.`);
        return false
    }
}