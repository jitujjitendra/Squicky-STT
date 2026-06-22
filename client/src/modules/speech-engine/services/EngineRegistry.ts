/**
 * Engine Registry
 *
 * Manages available transcription engines and provides engine
 * selection, initialization, and lifecycle management.
 *
 * Architecture decision: A registry pattern allows hot-swapping engines
 * and selecting the best engine based on file characteristics, user
 * preferences, or device capabilities. The platform never directly
 * instantiates engine-specific code.
 */

import type { TranscriptionEngine, EngineCapabilities } from '../types';

export interface EngineInfo {
  /** Engine unique identifier */
  id: string;
  /** Engine display name */
  name: string;
  /** Engine version */
  version: string;
  /** Engine capabilities */
  capabilities: EngineCapabilities;
  /** Whether the engine is currently loaded/ready */
  ready: boolean;
}

export class EngineRegistry {
  private engines: Map<string, TranscriptionEngine> = new Map();
  private defaultEngineId: string | null = null;

  /**
   * Register a transcription engine
   */
  register(id: string, engine: TranscriptionEngine): void {
    this.engines.set(id, engine);
    if (!this.defaultEngineId) {
      this.defaultEngineId = id;
    }
  }

  /**
   * Unregister an engine
   */
  unregister(id: string): void {
    this.engines.delete(id);
    if (this.defaultEngineId === id) {
      this.defaultEngineId = this.engines.keys().next().value ?? null;
    }
  }

  /**
   * Get an engine by ID
   */
  get(id: string): TranscriptionEngine | undefined {
    return this.engines.get(id);
  }

  /**
   * Get the default engine
   */
  getDefault(): TranscriptionEngine | undefined {
    if (!this.defaultEngineId) return undefined;
    return this.engines.get(this.defaultEngineId);
  }

  /**
   * Set the default engine
   */
  setDefault(id: string): void {
    if (!this.engines.has(id)) {
      throw new Error(`Engine "${id}" not registered`);
    }
    this.defaultEngineId = id;
  }

  /**
   * Get the default engine ID
   */
  getDefaultId(): string | null {
    return this.defaultEngineId;
  }

  /**
   * List all registered engines with their info
   */
  list(): EngineInfo[] {
    const result: EngineInfo[] = [];
    this.engines.forEach((engine, id) => {
      result.push({
        id,
        name: engine.name(),
        version: engine.version(),
        capabilities: engine.capabilities(),
        ready: engine.isReady(),
      });
    });
    return result;
  }

  /**
   * Find engines that support a given language
   */
  findByLanguage(language: string): EngineInfo[] {
    return this.list().filter((info) =>
      info.capabilities.languages.includes(language) ||
      info.capabilities.languages.includes('*')
    );
  }

  /**
   * Find engines that support streaming
   */
  findStreaming(): EngineInfo[] {
    return this.list().filter((info) => info.capabilities.streaming);
  }

  /**
   * Initialize a specific engine
   */
  async initialize(id: string): Promise<void> {
    const engine = this.engines.get(id);
    if (!engine) throw new Error(`Engine "${id}" not registered`);
    await engine.initialize();
  }

  /**
   * Initialize all registered engines
   */
  async initializeAll(): Promise<void> {
    const promises = Array.from(this.engines.values()).map((e) =>
      e.initialize().catch(() => {
        // Log but don't fail if one engine fails to initialize
      })
    );
    await Promise.all(promises);
  }

  /**
   * Dispose all engines and clear the registry
   */
  async dispose(): Promise<void> {
    const promises = Array.from(this.engines.values()).map((e) => e.dispose());
    await Promise.all(promises);
    this.engines.clear();
    this.defaultEngineId = null;
  }

  /**
   * Number of registered engines
   */
  get size(): number {
    return this.engines.size;
  }
}
