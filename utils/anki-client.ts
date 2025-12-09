
export interface AnkiResponse<T> {
    result: T;
    error: string | null;
}

export const invokeAnki = async <T>(action: string, params: any = {}, baseUrl: string = 'http://127.0.0.1:8765'): Promise<T> => {
    try {
        const response = await fetch(baseUrl, {
            method: 'POST',
            body: JSON.stringify({ action, version: 6, params }),
            headers: { 'Content-Type': 'application/json' }
        });
        const json: AnkiResponse<T> = await response.json();
        if (json.error) {
            throw new Error(json.error);
        }
        return json.result;
    } catch (e: any) {
        throw new Error(`Anki Connect Error: ${e.message}`);
    }
};

export const pingAnki = async (baseUrl: string): Promise<string> => {
    // 'version' action returns the API version number
    return invokeAnki<string>('version', {}, baseUrl);
};

export const addNotesToAnki = async (notes: any[], baseUrl: string) => {
    // 'addNotes' action takes an array of notes
    return invokeAnki<(number | null)[]>('addNotes', { notes }, baseUrl);
};

export const findNotesInDeck = async (deckName: string, baseUrl: string) => {
    // Find all notes in a specific deck
    return invokeAnki<number[]>('findNotes', { query: `deck:"${deckName}"` }, baseUrl);
};

export const getNotesInfo = async (noteIds: number[], baseUrl: string) => {
    return invokeAnki<any[]>('notesInfo', { notes: noteIds }, baseUrl);
};

export const getCardsInfo = async (query: string, baseUrl: string) => {
    // 1. Find cards matching query
    const cardIds = await invokeAnki<number[]>('findCards', { query }, baseUrl);
    if (cardIds.length === 0) return [];
    
    // 2. Get card details
    return invokeAnki<any[]>('cardsInfo', { cards: cardIds }, baseUrl);
};
