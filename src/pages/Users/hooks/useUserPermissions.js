import { useCallback } from 'react';

export function useUserPermissions(currentUser) {
  const currentUserId = currentUser?.id ?? null;
  const currentUserEmail = currentUser?.email ?? null;

  const canDeleteUser = useCallback((targetUserId, targetEmail) => {
    if (currentUserId === null || targetUserId === null) return false;
    const isSelf = Number(targetUserId) === Number(currentUserId) || 
                   (currentUserEmail && targetEmail === currentUserEmail);
    return !isSelf;
  }, [currentUserId, currentUserEmail]);

  const canDeactivateUser = useCallback((targetUserId, targetIsActive, targetEmail) => {
    if (currentUserId === null || targetUserId === null) return true;
    const isSelf = Number(targetUserId) === Number(currentUserId) || 
                   (currentUserEmail && targetEmail === currentUserEmail);
    // If the target is ourselves, and we are trying to deactivate, block it.
    if (isSelf && targetIsActive === false) {
      return false;
    }
    return true;
  }, [currentUserId, currentUserEmail]);

  const isAdmin = useCallback(() => {
    return currentUser?.role === 'admin';
  }, [currentUser]);

  return {
    canDeleteUser,
    canDeactivateUser,
    isAdmin,
  };
}
