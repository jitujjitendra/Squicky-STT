/**
 * TemplateSelector Component
 *
 * Displays available export templates as selectable cards.
 * Each card shows the template name and brief description.
 */
import { useExportCenterStore } from '../store';
import { templates } from '../services/TemplateEngine';
import type { TemplateName } from '../types';

/**
 * Template selector component
 */
export function TemplateSelector() {
  const selectedTemplate = useExportCenterStore((s) => s.options.template);
  const setTemplate = useExportCenterStore((s) => s.setTemplate);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
        Template
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {templates.map((template) => (
          <button
            key={template.name}
            type="button"
            onClick={() => setTemplate(template.name as TemplateName)}
            className={`
              text-left p-3 rounded-lg border-2 transition-all duration-200
              ${selectedTemplate === template.name
                ? 'border-accent bg-accent/10 dark:bg-accent/20'
                : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-500'
              }
              cursor-pointer hover:shadow-sm
            `.trim()}
            aria-pressed={selectedTemplate === template.name}
          >
            <span className="block text-sm font-medium text-neutral-800 dark:text-neutral-200">
              {template.label}
            </span>
            <span className="block text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              {template.description}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
