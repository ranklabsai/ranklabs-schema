import type { ValidationIssue } from './validate';

export function formatValidationIssues(issues: ValidationIssue[]): string {
  if (issues.length === 0) return '[ranklabs-schema] No validation issues.';

  return issues
    .map((i) => {
      return `- (${i.code}) ${i.path}: ${i.message}`;
    })
    .join('\n');
}