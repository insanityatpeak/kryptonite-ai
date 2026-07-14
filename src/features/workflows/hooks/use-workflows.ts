import {
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";
import { useWorkflowsParams } from "./use-workflows-params";

/**
 * Hook to fetch all workflows using suspense
 */
export const useSuspenseWorkflows = () => {
  const trpc = useTRPC();
  const [params] = useWorkflowsParams();

  return useSuspenseQuery(trpc.workflows.getMany.queryOptions(params));
};

/**
 * Hook to create a new workflow
 */
export const useCreateWorkflow = () => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  return useMutation(
    trpc.workflows.create.mutationOptions({
      onSuccess: (data) => {
        toast.success(`Workflow "${data.name}" created`);
        queryClient.invalidateQueries(trpc.workflows.getMany.queryOptions({}));
      },
      onError: (error) => {
        toast.error(`Failed to create workflow: ${error.message}`);
      },
    }),
  );
};

/**
 * Hook to duplicate a workflow, including its nodes and connections
 */
export const useDuplicateWorkflow = () => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  return useMutation(
    trpc.workflows.duplicate.mutationOptions({
      onSuccess: (data) => {
        toast.success(`Duplicated as "${data.name}"`);
        queryClient.invalidateQueries(trpc.workflows.getMany.queryOptions({}));
      },
      onError: (error) => {
        toast.error(`Failed to duplicate workflow: ${error.message}`);
      },
    }),
  );
};

/**
 * Hook to remove a workflow (soft delete — moves it to trash)
 */
export const useRemoveWorkflow = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const restoreWorkflow = useRestoreWorkflow();

  return useMutation(
    trpc.workflows.remove.mutationOptions({
      onSuccess: (data) => {
        toast.success(`Workflow "${data.name}" moved to trash`, {
          action: {
            label: "Undo",
            onClick: () => restoreWorkflow.mutate({ id: data.id }),
          },
        });
        queryClient.invalidateQueries(trpc.workflows.getMany.queryOptions({}));
        queryClient.invalidateQueries(
          trpc.workflows.getOne.queryFilter({ id: data.id }),
        );
      },
    }),
  );
};

/**
 * Hook to list trashed workflows
 */
export const useTrashedWorkflows = (
  params: { page?: number; pageSize?: number } = {},
) => {
  const trpc = useTRPC();
  return useQuery(trpc.workflows.listTrash.queryOptions(params));
};

/**
 * Hook to restore a workflow out of trash
 */
export const useRestoreWorkflow = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.workflows.restore.mutationOptions({
      onSuccess: (data) => {
        toast.success(`Workflow "${data.name}" restored`);
        queryClient.invalidateQueries(trpc.workflows.getMany.queryOptions({}));
        queryClient.invalidateQueries(
          trpc.workflows.listTrash.queryOptions({}),
        );
      },
      onError: (error) => {
        toast.error(`Failed to restore workflow: ${error.message}`);
      },
    }),
  );
};

/**
 * Hook to permanently delete a workflow from trash
 */
export const usePermanentlyDeleteWorkflow = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.workflows.permanentlyDelete.mutationOptions({
      onSuccess: () => {
        toast.success("Workflow permanently deleted");
        queryClient.invalidateQueries(
          trpc.workflows.listTrash.queryOptions({}),
        );
      },
      onError: (error) => {
        toast.error(`Failed to delete workflow: ${error.message}`);
      },
    }),
  );
};

/**
 * Hook to fetch a single workflow using suspense
 */
export const useSuspenseWorkflow = (id: string) => {
  const trpc = useTRPC();
  return useSuspenseQuery(trpc.workflows.getOne.queryOptions({ id }));
};

/**
 * Hook to update a workflow name
 */
export const useUpdateWorkflowName = () => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  return useMutation(
    trpc.workflows.updateName.mutationOptions({
      onSuccess: (data) => {
        toast.success(`Workflow "${data.name}" updated`);
        queryClient.invalidateQueries(trpc.workflows.getMany.queryOptions({}));
        queryClient.invalidateQueries(
          trpc.workflows.getOne.queryOptions({ id: data.id }),
        );
      },
      onError: (error) => {
        toast.error(`Failed to update workflow: ${error.message}`);
      },
    }),
  );
};

/**
 * Hook to update a workflow
 */
export const useUpdateWorkflow = () => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  return useMutation(
    trpc.workflows.update.mutationOptions({
      onSuccess: (data) => {
        toast.success(`Workflow "${data.name}" saved`);
        queryClient.invalidateQueries(trpc.workflows.getMany.queryOptions({}));
        queryClient.invalidateQueries(
          trpc.workflows.getOne.queryOptions({ id: data.id }),
        );
      },
      onError: (error) => {
        toast.error(`Failed to save workflow: ${error.message}`);
      },
    }),
  );
};

/**
 * Hook to execute a workflow
 */
export const useExecuteWorkflow = () => {
  const trpc = useTRPC();

  return useMutation(
    trpc.workflows.execute.mutationOptions({
      onError: (error) => {
        toast.error(`Failed to execute workflow: ${error.message}`);
      },
    }),
  );
};

/**
 * Hook to list saved versions of a workflow
 */
export const useWorkflowVersions = (workflowId: string) => {
  const trpc = useTRPC();
  return useQuery(trpc.workflows.listVersions.queryOptions({ workflowId }));
};

/**
 * Hook to restore a workflow to a previous version
 */
export const useRestoreWorkflowVersion = () => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  return useMutation(
    trpc.workflows.restoreVersion.mutationOptions({
      onSuccess: (data) => {
        toast.success("Workflow restored to selected version");
        queryClient.invalidateQueries(
          trpc.workflows.getOne.queryOptions({ id: data.id }),
        );
        queryClient.invalidateQueries(
          trpc.workflows.listVersions.queryOptions({ workflowId: data.id }),
        );
      },
      onError: (error) => {
        toast.error(`Failed to restore version: ${error.message}`);
      },
    }),
  );
};
