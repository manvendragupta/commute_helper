import { type User, type InsertUser, type BartStationData, type RouteRecommendation } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // BART data caching methods
  cacheStationData(station: string, data: BartStationData, ttl?: number): Promise<void>;
  getCachedStationData(station: string): Promise<BartStationData | undefined>;
  cacheRouteRecommendation(data: RouteRecommendation, ttl?: number): Promise<void>;
  getCachedRouteRecommendation(): Promise<RouteRecommendation | undefined>;
  cacheAllRouteRecommendations(data: Record<string, RouteRecommendation>, ttl?: number): Promise<void>;
  getCachedAllRouteRecommendations(): Promise<Record<string, RouteRecommendation> | undefined>;
}

interface CacheItem<T> {
  data: T;
  expiresAt: number;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private cache: Map<string, CacheItem<any>>;

  constructor() {
    this.users = new Map();
    this.cache = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async cacheStationData(station: string, data: BartStationData, ttl = 30000): Promise<void> {
    const key = `station_${station}`;
    const expiresAt = Date.now() + ttl;
    this.cache.set(key, { data, expiresAt });
  }

  async getCachedStationData(station: string): Promise<BartStationData | undefined> {
    const key = `station_${station}`;
    const item = this.cache.get(key);
    
    if (!item || Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }
    
    return item.data;
  }

  async cacheRouteRecommendation(data: RouteRecommendation, ttl = 30000): Promise<void> {
    const key = 'route_recommendation';
    const expiresAt = Date.now() + ttl;
    this.cache.set(key, { data, expiresAt });
  }

  async getCachedRouteRecommendation(): Promise<RouteRecommendation | undefined> {
    const key = 'route_recommendation';
    const item = this.cache.get(key);
    
    if (!item || Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }
    
    return item.data;
  }

  async cacheAllRouteRecommendations(data: Record<string, RouteRecommendation>, ttl = 30000): Promise<void> {
    const key = 'all_route_recommendations';
    const expiresAt = Date.now() + ttl;
    this.cache.set(key, { data, expiresAt });
  }

  async getCachedAllRouteRecommendations(): Promise<Record<string, RouteRecommendation> | undefined> {
    const key = 'all_route_recommendations';
    const item = this.cache.get(key);
    
    if (!item || Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }
    
    return item.data;
  }
}

export const storage = new MemStorage();
