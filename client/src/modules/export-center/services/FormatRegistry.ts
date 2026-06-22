/**
 * Format Registry
 *
 * Central registry for all format converters. Provides lookup,
 * filtering, and batch conversion capabilities.
 */

import type { FormatConverter, ExportFormat, IntermediateDocument, ExportOptions } from '../types';
import {
  txtConverter,
  markdownConverter,
  htmlConverter,
  csvConverter,
  jsonConverter,
  srtConverter,
  vttConverter,
  pdfConverter,
  docxConverter,
} from './converters';

/**
 * Format Registry manages all registered format converters
 */
class FormatRegistryService {
  private converters: Map<ExportFormat, FormatConverter>;

  constructor() {
    this.converters = new Map();
    this.register(txtConverter);
    this.register(markdownConverter);
    this.register(htmlConverter);
    this.register(csvConverter);
    this.register(jsonConverter);
    this.register(srtConverter);
    this.register(vttConverter);
    this.register(pdfConverter);
    this.register(docxConverter);
  }

  /**
   * Register a format converter
   */
  register(converter: FormatConverter): void {
    this.converters.set(converter.format, converter);
  }

  /**
   * Get a converter by format
   */
  get(format: ExportFormat): FormatConverter | undefined {
    return this.converters.get(format);
  }

  /**
   * Get all registered converters
   */
  getAll(): FormatConverter[] {
    return Array.from(this.converters.values());
  }

  /**
   * Get all available (fully implemented) format identifiers
   */
  getAvailableFormats(): ExportFormat[] {
    return this.getAll()
      .filter((c) => c.available)
      .map((c) => c.format);
  }

  /**
   * Get all format identifiers (including unavailable)
   */
  getAllFormats(): ExportFormat[] {
    return this.getAll().map((c) => c.format);
  }

  /**
   * Convert a document to a specific format
   */
  convert(format: ExportFormat, doc: IntermediateDocument, options: ExportOptions): string {
    const converter = this.get(format);
    if (!converter) {
      throw new Error(`No converter registered for format "${format}"`);
    }
    return converter.convert(doc, options);
  }
}

/** Singleton format registry instance */
export const formatRegistry = new FormatRegistryService();
