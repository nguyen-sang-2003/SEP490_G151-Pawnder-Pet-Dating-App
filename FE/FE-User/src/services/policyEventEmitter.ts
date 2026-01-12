import { PendingPolicy } from '../features/policy/api/policyApi';
import { AxiosRequestConfig } from 'axios';

/**
 * Policy Event Emitter Service
 * Handles POLICY_REQUIRED events for global policy compliance checks
 */

// =============== Event Types ===============

export type PolicyEventType = 'POLICY_REQUIRED';

export interface PolicyRequiredPayload {
  pendingPolicies: PendingPolicy[];
  originalRequest: AxiosRequestConfig;
  onAccepted: () => void | Promise<void>;
  onRejected: (error: any) => void;
}

export type PolicyEventPayload = {
  POLICY_REQUIRED: PolicyRequiredPayload;
};

type PolicyEventCallback<T extends PolicyEventType> = (payload: PolicyEventPayload[T]) => void;

// =============== Event Emitter Implementation ===============

class PolicyEventEmitter {
  private listeners: Map<PolicyEventType, Set<PolicyEventCallback<any>>> = new Map();

  /**
   * Subscribe to a policy event
   * @param event - The event type to subscribe to
   * @param callback - The callback function to execute when event is emitted
   * @returns Unsubscribe function
   */
  subscribe<T extends PolicyEventType>(
    event: T,
    callback: PolicyEventCallback<T>
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    const eventListeners = this.listeners.get(event)!;
    eventListeners.add(callback);

    // Return unsubscribe function
    return () => {
      eventListeners.delete(callback);
      if (eventListeners.size === 0) {
        this.listeners.delete(event);
      }
    };
  }

  /**
   * Emit a policy event
   * @param event - The event type to emit
   * @param payload - The payload to pass to listeners
   */
  emit<T extends PolicyEventType>(event: T, payload: PolicyEventPayload[T]): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(payload);
        } catch (error) {
          console.error(`Error in policy event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Check if there are any listeners for an event
   * @param event - The event type to check
   * @returns True if there are listeners
   */
  hasListeners(event: PolicyEventType): boolean {
    const eventListeners = this.listeners.get(event);
    return eventListeners ? eventListeners.size > 0 : false;
  }

  /**
   * Remove all listeners for an event
   * @param event - The event type to clear
   */
  removeAllListeners(event?: PolicyEventType): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
}

// Singleton instance
const policyEventEmitter = new PolicyEventEmitter();

// =============== Policy Check Control ===============

/**
 * Global flag to temporarily disable policy checks during registration flow
 */
let policyCheckEnabled = true;

/**
 * Temporarily disable policy checks (e.g., during registration flow)
 */
export const disablePolicyCheck = (): void => {
  policyCheckEnabled = false;
  console.log('[PolicyEmitter] Policy checks disabled (registration flow)');
};

/**
 * Re-enable policy checks
 */
export const enablePolicyCheck = (): void => {
  policyCheckEnabled = true;
  console.log('[PolicyEmitter] Policy checks enabled');
};

/**
 * Check if policy checks are enabled
 */
export const isPolicyCheckEnabled = (): boolean => {
  return policyCheckEnabled;
};

// =============== Exported Functions ===============

/**
 * Subscribe to POLICY_REQUIRED events
 * @param callback - Callback to execute when policy is required
 * @returns Unsubscribe function
 */
export const subscribeToPolicyRequired = (
  callback: PolicyEventCallback<'POLICY_REQUIRED'>
): (() => void) => {
  return policyEventEmitter.subscribe('POLICY_REQUIRED', callback);
};

/**
 * Emit POLICY_REQUIRED event (only if policy checks are enabled)
 * @param payload - The policy required payload
 */
export const emitPolicyRequired = (payload: PolicyRequiredPayload): void => {
  if (!policyCheckEnabled) {
    console.log('[PolicyEmitter] Policy event suppressed (registration flow)');
    return;
  }
  policyEventEmitter.emit('POLICY_REQUIRED', payload);
};

/**
 * Check if there are listeners for POLICY_REQUIRED
 * @returns True if there are listeners
 */
export const hasPolicyRequiredListeners = (): boolean => {
  return policyEventEmitter.hasListeners('POLICY_REQUIRED');
};

export default policyEventEmitter;
