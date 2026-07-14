import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { ExecutionStatus } from "@/generated/prisma";
import { useTRPC } from "@/trpc/client";
import { useExecutionsParams } from "./use-executions-params";

/**
 * Hook to fetch all executions using suspense
 */
export const useSuspenseExecutions = () => {
  const trpc = useTRPC();
  const [params] = useExecutionsParams();

  return useSuspenseQuery(trpc.executions.getMany.queryOptions(params));
};

/**
 * Hook to fetch a single execution using suspense
 */
export const useSuspenseExecution = (id: string) => {
  const trpc = useTRPC();
  return useSuspenseQuery(trpc.executions.getOne.queryOptions({ id }));
};

/**
 * Polls a single execution's status until it leaves RUNNING, so UI like the
 * "execution started" modal can reflect completion without a manual refresh.
 */
export const useExecutionStatusPoll = (id: string | undefined) => {
  const trpc = useTRPC();
  return useQuery({
    ...trpc.executions.getOne.queryOptions({ id: id ?? "" }),
    enabled: !!id,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status && status !== ExecutionStatus.RUNNING ? false : 2000;
    },
  });
};
