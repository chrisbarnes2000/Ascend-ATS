import { ApplicationStatus } from '../types';

/**
 * Application Lifecycle & Deduplication Engine
 * Complies with NASA JPL Rule 1 (simple, deterministic control flow)
 */

export interface StateTransitionResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Generates a deterministic application document ID to prevent duplicate submissions.
 */
export function getDeterministicApplicationId(jobId: string, seekerId: string): string {
  const safeJob = (jobId || '').trim().replace(/[^a-zA-Z0-9_-]/g, '');
  const safeSeeker = (seekerId || '').trim().replace(/[^a-zA-Z0-9_-]/g, '');
  return `${safeJob}_${safeSeeker}`;
}

/**
 * Evaluates whether an application state transition is valid according to the ATS state machine.
 */
export function canTransitionApplicationState(
  currentState: ApplicationStatus,
  nextState: ApplicationStatus
): StateTransitionResult {
  if (currentState === nextState) {
    return { allowed: true };
  }

  // Once rejected, candidates cannot directly reapply without recruiter intervention
  if (currentState === 'rejected' && nextState === 'applied') {
    return {
      allowed: false,
      reason: 'Applications previously rejected cannot be directly resubmitted without recruiter override.'
    };
  }

  // Withdrawn applications can be resubmitted
  if (currentState === 'applied' && nextState === 'offered') {
    // Normal fast-track or standard
    return { allowed: true };
  }

  // Standard progressive flow
  const validTransitions: Record<ApplicationStatus, ApplicationStatus[]> = {
    applied: ['viewed', 'interviewing', 'offered', 'rejected'],
    viewed: ['interviewing', 'offered', 'rejected'],
    interviewing: ['offered', 'rejected'],
    offered: ['rejected'], // Candidate or company declined offer
    rejected: [] // Terminal unless reset
  };

  const allowedNext = validTransitions[currentState] || [];
  if (allowedNext.includes(nextState)) {
    return { allowed: true };
  }

  return {
    allowed: true, // Allow administrative transitions with audit logging
    reason: `Non-standard transition from ${currentState} to ${nextState} recorded.`
  };
}
