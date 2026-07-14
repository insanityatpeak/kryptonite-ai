export const useSubscription = () => ({ data: null, isLoading: false });

export const useHasActiveSubscription = () => ({
  hasActiveSubscription: false,
  subscription: undefined,
  isLoading: false,
});
