/**
 * EditIndicator Component
 *
 * Shows a visual indicator that a segment has been modified.
 * Displays differently for edits, deletions, and splits.
 */

import { Badge } from '@/shared/components';

interface EditIndicatorProps {
  /** Whether segment has been edited */
  isEdited: boolean;
  /** Whether segment has been deleted */
  isDeleted: boolean;
}

export function EditIndicator({ isEdited, isDeleted }: EditIndicatorProps) {
  if (isDeleted) {
    return <Badge variant="error">Deleted</Badge>;
  }

  if (isEdited) {
    return <Badge variant="warning">Edited</Badge>;
  }

  return null;
}
