class StorageService {
    constructor() {
        this.storage = window.localStorage;
    }

    set(key, value) {
        try {
            const serializedValue = JSON.stringify(value);
            this.storage.setItem(key, serializedValue);
            return true;
        } catch (error) {
            console.error('Veri kaydedilirken hata:', error);
            return false;
        }
    }

    get(key) {
        try {
            const serializedValue = this.storage.getItem(key);
            return serializedValue ? JSON.parse(serializedValue) : null;
        } catch (error) {
            console.error('Veri okunurken hata:', error);
            return null;
        }
    }

    remove(key) {
        try {
            this.storage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Veri silinirken hata:', error);
            return false;
        }
    }

    clear() {
        try {
            this.storage.clear();
            return true;
        } catch (error) {
            console.error('Depolama temizlenirken hata:', error);
            return false;
        }
    }
}

export const storageService = new StorageService(); 