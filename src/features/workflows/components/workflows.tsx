"use client";

import { formatDistanceToNow } from "date-fns";
import { CopyIcon, Trash2Icon, WorkflowIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  EmptyView,
  EntityContainer,
  EntityHeader,
  EntityItem,
  EntityList,
  EntityPagination,
  EntitySearch,
  ErrorView,
  LoadingView,
} from "@/components/entity-components";
import { Button } from "@/components/ui/button";
import type { Workflow } from "@/generated/prisma";
import { useEntitySearch } from "@/hooks/use-entity-search";
import { useUpgradeModal } from "@/hooks/use-upgrade-modal";
import {
  useCreateWorkflow,
  useDuplicateWorkflow,
  usePermanentlyDeleteWorkflow,
  useRemoveWorkflow,
  useRestoreWorkflow,
  useSuspenseWorkflows,
  useTrashedWorkflows,
} from "../hooks/use-workflows";
import { useWorkflowsParams } from "../hooks/use-workflows-params";

export const WorkflowsSearch = () => {
  const [params, setParams] = useWorkflowsParams();
  const { searchValue, onSearchChange } = useEntitySearch({
    params,
    setParams,
  });

  return (
    <EntitySearch
      value={searchValue}
      onChange={onSearchChange}
      placeholder="Search workflows"
    />
  );
};

export const WorkflowsList = () => {
  const workflows = useSuspenseWorkflows();

  return (
    <EntityList
      items={workflows.data.items}
      getKey={(workflow) => workflow.id}
      renderItem={(workflow) => <WorkflowItem data={workflow} />}
      emptyView={<WorkflowsEmpty />}
    />
  );
};

export const WorkflowsHeader = ({ disabled }: { disabled?: boolean }) => {
  const router = useRouter();
  const createWorkflow = useCreateWorkflow();
  const { handleError, modal } = useUpgradeModal();

  const handleCreate = () => {
    createWorkflow.mutate(undefined, {
      onSuccess: (data) => {
        router.push(`/workflows/${data.id}`);
      },
      onError: (error) => {
        handleError(error);
      },
    });
  };

  return (
    <>
      {modal}
      <div className="flex items-center justify-between gap-x-4">
        <EntityHeader
          title="Workflows"
          description="Create and manage your workflows"
          onNew={handleCreate}
          newButtonLabel="New workflow"
          disabled={disabled}
          isCreating={createWorkflow.isPending}
        />
        <Button size="sm" variant="ghost" asChild>
          <Link href="/workflows/trash" prefetch>
            <Trash2Icon className="size-4" />
            Trash
          </Link>
        </Button>
      </div>
    </>
  );
};

export const WorkflowsPagination = () => {
  const workflows = useSuspenseWorkflows();
  const [params, setParams] = useWorkflowsParams();

  return (
    <EntityPagination
      disabled={workflows.isFetching}
      totalPages={workflows.data.totalPages}
      page={workflows.data.page}
      onPageChange={(page) => setParams({ ...params, page })}
    />
  );
};

export const WorkflowsContainer = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <EntityContainer
      header={<WorkflowsHeader />}
      search={<WorkflowsSearch />}
      pagination={<WorkflowsPagination />}
    >
      {children}
    </EntityContainer>
  );
};

export const WorkflowsLoading = () => {
  return <LoadingView message="Loading workflows..." />;
};

export const WorkflowsError = () => {
  return <ErrorView message="Error loading workflows" />;
};

export const WorkflowsEmpty = () => {
  const router = useRouter();
  const createWorkflow = useCreateWorkflow();
  const { handleError, modal } = useUpgradeModal();

  const handleCreate = () => {
    createWorkflow.mutate(undefined, {
      onError: (error) => {
        handleError(error);
      },
      onSuccess: (data) => {
        router.push(`/workflows/${data.id}`);
      },
    });
  };

  return (
    <>
      {modal}
      <EmptyView
        onNew={handleCreate}
        message="You haven't created any workflows yet. Get started by creating your first workflow"
      />
    </>
  );
};

export const WorkflowItem = ({ data }: { data: Workflow }) => {
  const removeWorkflow = useRemoveWorkflow();
  const duplicateWorkflow = useDuplicateWorkflow();

  const handleRemove = () => {
    const confirmed = window.confirm(
      `Delete workflow "${data.name}"? You can restore it from Trash afterward.`,
    );
    if (!confirmed) return;
    removeWorkflow.mutate({ id: data.id });
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    duplicateWorkflow.mutate({ id: data.id });
  };

  return (
    <EntityItem
      href={`/workflows/${data.id}`}
      title={data.name}
      subtitle={
        <>
          Updated {formatDistanceToNow(data.updatedAt, { addSuffix: true })}{" "}
          &bull; Created{" "}
          {formatDistanceToNow(data.createdAt, { addSuffix: true })}
        </>
      }
      image={
        <div className="size-8 flex items-center justify-center">
          <WorkflowIcon className="size-5 text-muted-foreground" />
        </div>
      }
      actions={
        <Button
          size="icon"
          variant="ghost"
          disabled={duplicateWorkflow.isPending}
          onClick={handleDuplicate}
          title="Duplicate workflow"
        >
          <CopyIcon className="size-4" />
        </Button>
      }
      onRemove={handleRemove}
      isRemoving={removeWorkflow.isPending}
    />
  );
};

export const TrashHeader = () => {
  return (
    <EntityHeader
      title="Trash"
      description="Deleted workflows are kept here until restored or permanently deleted"
    />
  );
};

export const TrashList = () => {
  const { data, isLoading } = useTrashedWorkflows();

  if (isLoading) {
    return <WorkflowsLoading />;
  }

  return (
    <EntityList
      items={data?.items ?? []}
      getKey={(workflow) => workflow.id}
      renderItem={(workflow) => <TrashItem data={workflow} />}
      emptyView={<EmptyView message="Trash is empty" />}
    />
  );
};

const TrashItem = ({ data }: { data: Workflow }) => {
  const restoreWorkflow = useRestoreWorkflow();
  const permanentlyDelete = usePermanentlyDeleteWorkflow();

  const handlePermanentDelete = () => {
    const confirmed = window.confirm(
      `Permanently delete "${data.name}"? This cannot be undone.`,
    );
    if (!confirmed) return;
    permanentlyDelete.mutate({ id: data.id });
  };

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl glass-card p-4">
      <div className="flex items-center gap-3">
        <div className="size-8 flex items-center justify-center">
          <WorkflowIcon className="size-5 text-muted-foreground" />
        </div>
        <div>
          <p className="text-base font-medium">{data.name}</p>
          <p className="text-xs text-muted-foreground">
            Deleted{" "}
            {data.deletedAt
              ? formatDistanceToNow(data.deletedAt, { addSuffix: true })
              : ""}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={restoreWorkflow.isPending}
          onClick={() => restoreWorkflow.mutate({ id: data.id })}
        >
          Restore
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-destructive hover:text-destructive"
          disabled={permanentlyDelete.isPending}
          onClick={handlePermanentDelete}
        >
          <Trash2Icon className="size-4" />
          Delete forever
        </Button>
      </div>
    </div>
  );
};
