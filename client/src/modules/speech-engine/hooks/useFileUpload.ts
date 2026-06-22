/**
 * File Upload Hook
 *
 * Manages file selection, drag-and-drop handling, and validation.
 * Provides a clean API for the UploadZone component.
 *
 * Architecture decision: Upload logic is separated from the component
 * to allow reuse in different upload interfaces (zone, button, API)
 * and to keep components purely presentational.
 */

import { useCallback, useRef } from 'react';
import { useSpeechEngineStore } from '../store';
import { ValidationService } from '../services';
import { EXTENSION_MIME_MAP } from '../types';

const validationService = new ValidationService();

/** Accepted file extensions for the file input */
const ACCEPT_STRING = Object.keys(EXTENSION_MIME_MAP).join(',');

export interface UseFileUploadReturn {
  /** Whether files are being dragged over the zone */
  isDragOver: boolean;
  /** Selected files */
  selectedFiles: File[];
  /** Upload/validation errors */
  errors: string[];
  /** Whether upload processing is in progress */
  isUploading: boolean;
  /** Accept string for file input */
  acceptString: string;
  /** Ref for the hidden file input */
  inputRef: React.RefObject<HTMLInputElement | null>;
  /** Handle drag enter event */
  handleDragEnter: (e: React.DragEvent) => void;
  /** Handle drag leave event */
  handleDragLeave: (e: React.DragEvent) => void;
  /** Handle drag over event */
  handleDragOver: (e: React.DragEvent) => void;
  /** Handle drop event */
  handleDrop: (e: React.DragEvent) => void;
  /** Handle file input change */
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Open the file browser */
  openFileBrowser: () => void;
  /** Clear selected files */
  clearFiles: () => void;
  /** Validate and process selected files */
  processFiles: (files: File[]) => Promise<File[]>;
}

export function useFileUpload(): UseFileUploadReturn {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const {
    upload,
    setDragOver,
    setSelectedFiles,
    addUploadError,
    clearUploadErrors,
    setIsUploading,
    resetUpload,
  } = useSpeechEngineStore();

  const handleDragEnter = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(true);
    },
    [setDragOver]
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      // Only set false if leaving the drop zone (not entering a child)
      if (e.currentTarget === e.target) {
        setDragOver(false);
      }
    },
    [setDragOver]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    },
    []
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        void processFiles(files);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setDragOver]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      if (files.length > 0) {
        void processFiles(files);
      }
      // Reset input so the same file can be selected again
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const openFileBrowser = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const clearFiles = useCallback(() => {
    resetUpload();
  }, [resetUpload]);

  const processFiles = useCallback(
    async (files: File[]): Promise<File[]> => {
      clearUploadErrors();
      setIsUploading(true);

      const validFiles: File[] = [];

      for (const file of files) {
        const result = await validationService.validate(file);
        if (result.valid) {
          validFiles.push(file);
        } else {
          result.errors.forEach((err) => addUploadError(`${file.name}: ${err.message}`));
        }
      }

      setSelectedFiles(validFiles);
      setIsUploading(false);
      return validFiles;
    },
    [clearUploadErrors, setIsUploading, setSelectedFiles, addUploadError]
  );

  return {
    isDragOver: upload.isDragOver,
    selectedFiles: upload.selectedFiles,
    errors: upload.errors,
    isUploading: upload.isUploading,
    acceptString: ACCEPT_STRING,
    inputRef,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    handleFileChange,
    openFileBrowser,
    clearFiles,
    processFiles,
  };
}
