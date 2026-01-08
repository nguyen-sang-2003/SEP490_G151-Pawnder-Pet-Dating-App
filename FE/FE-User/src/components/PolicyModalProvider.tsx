import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import PolicyRequiredModal from './PolicyRequiredModal';
import { 
  subscribeToPolicyRequired, 
  PolicyRequiredPayload 
} from '../services/policyEventEmitter';
import { 
  PendingPolicy, 
  PolicyAcceptRequest, 
  acceptAllPolicies 
} from '../features/policy/api/policyApi';

/**
 * PolicyModalProvider Context
 * Provides global policy modal state and handlers
 */

interface PolicyModalContextType {
  isModalVisible: boolean;
  pendingPolicies: PendingPolicy[];
}

const PolicyModalContext = createContext<PolicyModalContextType>({
  isModalVisible: false,
  pendingPolicies: [],
});

export const usePolicyModal = () => useContext(PolicyModalContext);

interface PolicyModalProviderProps {
  children: ReactNode;
}

/**
 * PolicyModalProvider Component
 * Wraps app content and handles POLICY_REQUIRED events globally
 * Shows PolicyRequiredModal when policy acceptance is needed
 */
const PolicyModalProvider: React.FC<PolicyModalProviderProps> = ({ children }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [pendingPolicies, setPendingPolicies] = useState<PendingPolicy[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Use ref to avoid closure issues with callbacks
  const currentPayloadRef = useRef<PolicyRequiredPayload | null>(null);

  // Subscribe to POLICY_REQUIRED events
  useEffect(() => {
    const unsubscribe = subscribeToPolicyRequired((payload: PolicyRequiredPayload) => {
      currentPayloadRef.current = payload;
      setPendingPolicies(payload.pendingPolicies);
      setIsModalVisible(true);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Handle accept all policies
  const handleAcceptAll = useCallback(async () => {
    const currentPayload = currentPayloadRef.current;
    
    if (!currentPayload || pendingPolicies.length === 0) {
      return;
    }

    setLoading(true);

    try {
      // Build accept request from pending policies
      const acceptRequests: PolicyAcceptRequest[] = pendingPolicies.map(policy => ({
        policyCode: policy.policyCode,
        versionNumber: policy.versionNumber,
      }));

      // Call API to accept all policies
      await acceptAllPolicies(acceptRequests);

      // Store callback before clearing state
      const onAcceptedCallback = currentPayload.onAccepted;

      // Close modal and clear state first
      setIsModalVisible(false);
      setPendingPolicies([]);
      currentPayloadRef.current = null;
      setLoading(false);

      // Call the callback to retry original request
      await onAcceptedCallback();
    } catch (error) {
      // On error, keep modal open for retry
      console.error('Failed to accept policies:', error);
      setLoading(false);
    }
  }, [pendingPolicies]);

  const contextValue: PolicyModalContextType = {
    isModalVisible,
    pendingPolicies,
  };

  return (
    <PolicyModalContext.Provider value={contextValue}>
      {children}
      <PolicyRequiredModal
        visible={isModalVisible}
        pendingPolicies={pendingPolicies}
        onAcceptAll={handleAcceptAll}
        loading={loading}
      />
    </PolicyModalContext.Provider>
  );
};

export default PolicyModalProvider;
