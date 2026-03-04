// Mapping ID Dukuh → Nama Resmi
export const DUKUH_MAP = {
    dukuh1: 'Botoan',
    dukuh2: 'Kebaron',
    dukuh3: 'Krajan',
    dukuh4: 'Karangjati',
    dukuh5: 'Cepagan Lor',
    dukuh6: 'Luar Cepagan',
};

// Array untuk dropdown pilihan
export const STANDS = Object.keys(DUKUH_MAP); // ['dukuh1', ..., 'dukuh5']

// Helper: ambil nama tampilan dari ID
export function getDukuhName(id) {
    return DUKUH_MAP[id] || id;
}
