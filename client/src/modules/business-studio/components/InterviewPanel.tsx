/**
 * Interview Panel
 *
 * Displays interview intelligence for recruitment mode:
 * candidate strengths, concerns, and detected skills.
 * Only visible when business mode is "recruitment-interview".
 */
import { Badge } from '@/shared/components';
import { useBusinessStudioStore } from '../store';

export function InterviewPanel() {
  const interviewIntelligence = useBusinessStudioStore((s) => s.interviewIntelligence);
  const businessMode = useBusinessStudioStore((s) => s.businessMode);

  if (businessMode !== 'recruitment-interview' || !interviewIntelligence) return null;

  const { strengths, concerns, skillsDetected } = interviewIntelligence;

  if (strengths.length === 0 && concerns.length === 0 && skillsDetected.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4 space-y-4">
      <h2 className="text-base font-semibold text-neutral-800 dark:text-neutral-200">
        Interview Intelligence
      </h2>

      {/* Skills */}
      {skillsDetected.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-2">
            Skills Detected
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {skillsDetected.map((skill, idx) => (
              <Badge key={idx} variant="default">{skill}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Strengths */}
      {strengths.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-2">
            Strengths
          </h3>
          <ul className="space-y-1">
            {strengths.map((s, idx) => (
              <li key={idx} className="text-sm text-neutral-700 dark:text-neutral-300 flex items-start gap-2">
                <span className="text-green-500 mt-0.5">+</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Concerns */}
      {concerns.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-2">
            Concerns
          </h3>
          <ul className="space-y-1">
            {concerns.map((c, idx) => (
              <li key={idx} className="text-sm text-neutral-700 dark:text-neutral-300 flex items-start gap-2">
                <span className="text-red-500 mt-0.5">-</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
