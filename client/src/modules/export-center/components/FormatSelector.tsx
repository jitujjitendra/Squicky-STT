/**
 * FormatSelector Component
 *
 * Displays a responsive grid of clickable format chips.
 * Each chip shows the format name and availability state.
 * Supports multi-select for batch export.
 */
import { Badge } from '@/shared/components';
import { useExportCenterStore } from '../store';
import { formatRegistry } from '../services/FormatRegistry';
import type { ExportFormat } from '../types';

/**
 * Format chip data
 */
interface FormatChipProps {
  format: ExportFormat;
  label: string;
  available: boolean;
  selected: boolean;
  onToggle: (format: ExportFormat) => void;
}

/** Individual format chip */
function FormatChip({ format, label, available, selected, onToggle }: FormatChipProps) {
  return (
    <button
      type="button"
      disabled={!available}
      onClick={() => onToggle(format)}
      className={`
        flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all duration-200
        ${selected
          ? 'border-accent bg-accent/10 dark:bg-accent/20'
          : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-500'
        }
        ${!available
          ? 'opacity-50 cursor-not-allowed'
          : 'cursor-pointer hover:shadow-sm'
        }
      `.trim()}
      aria-pressed={selected}
      aria-label={`Export as ${label}${!available ? ' (unavailable)' : ''}`}
    >
      <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
        {label}
      </span>
      <span className="text-xs text-neutral-500 dark:text-neutral-400 uppercase">
        .{format === 'markdown' ? 'md' : format}
      </span>
      {!available && (
        <Badge variant="warning">Soon</Badge>
      )}
    </button>
  );
}

/**
 * Format selector grid component
 */
export function FormatSelector() {
  const selectedFormats = useExportCenterStore((s) => s.selectedFormats);
  const toggleFormat = useExportCenterStore((s) => s.toggleFormat);

  const converters = formatRegistry.getAll();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
          Export Formats
        </h3>
        {selectedFormats.length > 0 && (
          <Badge variant="info">{selectedFormats.length} selected</Badge>
        )}
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
        {converters.map((converter) => (
          <FormatChip
            key={converter.format}
            format={converter.format}
            label={converter.label}
            available={converter.available}
            selected={selectedFormats.includes(converter.format)}
            onToggle={toggleFormat}
          />
        ))}
      </div>
    </div>
  );
}
