import { supabase } from "@/lib/supabase/client";

export type ClassGroup = {
  id: string;
  name: string;
  code: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type ParentClassAssignment = {
  id: string;
  parent_id: string | null;
  class_id: string | null;
  child_name: string | null;
  status: "ACTIVE" | "REMOVED";
  created_at: string;
  class_groups?: Pick<ClassGroup, "id" | "name" | "code"> | null;
};

type ParentClassAssignmentRow = Omit<ParentClassAssignment, "class_groups"> & {
  class_groups?: Pick<ClassGroup, "id" | "name" | "code"> | null | Array<Pick<ClassGroup, "id" | "name" | "code">>;
};

const classGroupSelect = "id, name, code, created_by, created_at, updated_at";

export async function getClassGroups(): Promise<ClassGroup[]> {
  const { data, error } = await supabase
    .from("class_groups")
    .select(classGroupSelect)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function createClassGroup(input: {
  name: string;
  code: string;
}): Promise<ClassGroup> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("You must be logged in as CEO to create a class.");
  }

  const { data, error } = await supabase
    .from("class_groups")
    .insert({
      code: input.code.trim().toUpperCase(),
      created_by: user.id,
      name: input.name.trim(),
    })
    .select(classGroupSelect)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getParentClassAssignments(): Promise<
  ParentClassAssignment[]
> {
  const { data, error } = await supabase
    .from("parent_class_assignments")
    .select(
      "id, parent_id, class_id, child_name, status, created_at, class_groups(id, name, code)"
    )
    .eq("status", "ACTIVE")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((assignment: ParentClassAssignmentRow) => ({
    ...assignment,
    class_groups: Array.isArray(assignment.class_groups)
      ? (assignment.class_groups[0] ?? null)
      : (assignment.class_groups ?? null),
  }));
}

export async function assignParentToClass(input: {
  parentId: string;
  classId: string;
  childName?: string;
}): Promise<ParentClassAssignment> {
  const childName = input.childName?.trim() || null;
  const { data, error } = await supabase
    .from("parent_class_assignments")
    .upsert(
      {
        child_name: childName,
        class_id: input.classId,
        parent_id: input.parentId,
        status: "ACTIVE",
      },
      { onConflict: "parent_id,class_id,child_name" }
    )
    .select("id, parent_id, class_id, child_name, status, created_at")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function removeParentFromClass(input: {
  assignmentId: string;
}): Promise<void> {
  const { error } = await supabase
    .from("parent_class_assignments")
    .update({ status: "REMOVED" })
    .eq("id", input.assignmentId);

  if (error) {
    throw error;
  }
}
