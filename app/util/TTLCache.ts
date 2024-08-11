import TTLCache from '@isaacs/ttlcache';

export class TTLCacheService {
    cache: TTLCache<any, any>;
    constructor(options: any) {
        this.cache = new TTLCache(options)
    }

    has = (key: any) => {
        return this.cache.has(key)
    }

    getValues = (): any[] => {
        const res: any = this.cache.values();
        return res;
    }

    getEntries = () => {
        return this.cache.entries()
    }

    clear = () => {
        this.cache.clear()
    }

    delete = (key: any) => {
        this.cache.delete(key)
    }

    get = (key: any): any => {
        return this.cache.get(key)
    }

    set = (key: any, obj: any) => {
        this.cache.set(key, obj)
    }
}