"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { areaApi, categoryApi, goalApi } from "@/lib/api/goals";
import {
  GoalPriority,
  TargetPeriod,
  type Area,
  type Category,
  type Goal,
  type GoalProgress,
  type ProgressStatus,
} from "@/types/goals";

type DialogMode =
  | { type: "none" }
  | { type: "area"; mode: "create" | "edit"; data?: Area }
  | {
      type: "category";
      mode: "create" | "edit";
      data?: Category;
      areaId?: number;
    }
  | { type: "goal"; mode: "create" | "edit"; data?: Goal; categoryId?: number };

export function GoalsManagement() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [progress, setProgress] = useState<Map<number, GoalProgress>>(
    new Map()
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogMode, setDialogMode] = useState<DialogMode>({ type: "none" });
  const [expandedAreas, setExpandedAreas] = useState<Set<number>>(new Set());

  // Form state
  const [areaForm, setAreaForm] = useState({ name: "", icon: "", order: 0 });
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    areaId: 0,
    order: 0,
  });
  const [goalForm, setGoalForm] = useState({
    name: "",
    purpose: "",
    priority: GoalPriority.IMPORTANT,
    targetHours: 10,
    targetPeriod: TargetPeriod.WEEKLY,
    minimumDaily: "",
    startDate: "",
    deadline: "",
    tags: "",
    categoryId: 0,
    isActive: true,
  });

  useEffect(() => {
    loadAreas();
  }, []);

  const loadAreas = async () => {
    try {
      setLoading(true);
      const [areasData, progressData] = await Promise.all([
        areaApi.getAll(),
        goalApi.getAllProgress(),
      ]);

      setAreas(areasData);

      // Convert progress array to map for easy lookup
      const progressMap = new Map<number, GoalProgress>();
      progressData.forEach((p) => progressMap.set(p.goalId, p));
      setProgress(progressMap);

      // Collapse all areas by default for cleaner UI
      setExpandedAreas(new Set());
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleAreaExpansion = (areaId: number) => {
    const newExpanded = new Set(expandedAreas);
    if (newExpanded.has(areaId)) {
      newExpanded.delete(areaId);
    } else {
      newExpanded.add(areaId);
    }
    setExpandedAreas(newExpanded);
  };

  // Area handlers
  const openCreateArea = () => {
    setAreaForm({ name: "", icon: "📁", order: areas.length });
    setDialogMode({ type: "area", mode: "create" });
  };

  const openEditArea = (area: Area) => {
    setAreaForm({ name: area.name, icon: area.icon || "", order: area.order });
    setDialogMode({ type: "area", mode: "edit", data: area });
  };

  const handleSaveArea = async () => {
    try {
      if (dialogMode.type === "area" && dialogMode.mode === "create") {
        await areaApi.create(areaForm);
        toast.success("Area created successfully");
      } else if (
        dialogMode.type === "area" &&
        dialogMode.mode === "edit" &&
        dialogMode.data
      ) {
        await areaApi.update(dialogMode.data.id, areaForm);
        toast.success("Area updated successfully");
      }
      closeDialog();
      loadAreas();
    } catch (err: any) {
      toast.error(err.message || "Failed to save area");
      setError(err.message);
    }
  };

  const handleDeleteArea = async (id: number) => {
    if (
      !confirm(
        "Delete this area? This will also delete all its categories and goals."
      )
    )
      return;
    try {
      await areaApi.delete(id);
      toast.success("Area deleted successfully");
      loadAreas();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete area");
      setError(err.message);
    }
  };

  // Category handlers
  const openCreateCategory = (areaId: number) => {
    const area = areas.find((a) => a.id === areaId);
    const order = area?.categories?.length || 0;
    setCategoryForm({ name: "", areaId, order });
    setDialogMode({ type: "category", mode: "create", areaId });
  };

  const openEditCategory = (category: Category) => {
    setCategoryForm({
      name: category.name,
      areaId: category.areaId,
      order: category.order,
    });
    setDialogMode({ type: "category", mode: "edit", data: category });
  };

  const handleSaveCategory = async () => {
    try {
      if (dialogMode.type === "category" && dialogMode.mode === "create") {
        await categoryApi.create(categoryForm);
        toast.success("Category created successfully");
      } else if (
        dialogMode.type === "category" &&
        dialogMode.mode === "edit" &&
        dialogMode.data
      ) {
        await categoryApi.update(dialogMode.data.id, categoryForm);
        toast.success("Category updated successfully");
      }
      closeDialog();
      loadAreas();
    } catch (err: any) {
      toast.error(err.message || "Failed to save category");
      setError(err.message);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm("Delete this category? This will also delete all its goals."))
      return;
    try {
      await categoryApi.delete(id);
      toast.success("Category deleted successfully");
      loadAreas();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete category");
      setError(err.message);
    }
  };

  // Goal handlers
  const openCreateGoal = (categoryId: number) => {
    setGoalForm({
      name: "",
      purpose: "",
      priority: GoalPriority.IMPORTANT,
      targetHours: 10,
      targetPeriod: TargetPeriod.WEEKLY,
      minimumDaily: "",
      startDate: "",
      deadline: "",
      tags: "",
      categoryId,
      isActive: true,
    });
    setDialogMode({ type: "goal", mode: "create", categoryId });
  };

  const openEditGoal = (goal: Goal) => {
    setGoalForm({
      name: goal.name,
      purpose: goal.purpose || "",
      priority: goal.priority,
      targetHours: Number(goal.targetHours),
      targetPeriod: goal.targetPeriod,
      minimumDaily: goal.minimumDaily ? String(goal.minimumDaily) : "",
      startDate: goal.startDate || "",
      deadline: goal.deadline || "",
      tags: goal.tags.join(", "),
      categoryId: goal.categoryId,
      isActive: goal.isActive,
    });
    setDialogMode({ type: "goal", mode: "edit", data: goal });
  };

  const handleSaveGoal = async () => {
    try {
      const tags = goalForm.tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t);

      const data = {
        name: goalForm.name,
        purpose: goalForm.purpose || undefined,
        priority: goalForm.priority,
        targetHours: goalForm.targetHours,
        targetPeriod: goalForm.targetPeriod,
        minimumDaily: goalForm.minimumDaily
          ? Number(goalForm.minimumDaily)
          : undefined,
        startDate: goalForm.startDate || undefined,
        deadline: goalForm.deadline || undefined,
        tags,
        categoryId: goalForm.categoryId,
        isActive: goalForm.isActive,
      };

      if (dialogMode.type === "goal" && dialogMode.mode === "create") {
        await goalApi.create(data);
        toast.success("Goal created successfully");
      } else if (
        dialogMode.type === "goal" &&
        dialogMode.mode === "edit" &&
        dialogMode.data
      ) {
        await goalApi.update(dialogMode.data.id, data);
        toast.success("Goal updated successfully");
      }
      closeDialog();
      loadAreas();
    } catch (err: any) {
      toast.error(err.message || "Failed to save goal");
      setError(err.message);
    }
  };

  const handleDeleteGoal = async (id: number) => {
    if (!confirm("Delete this goal?")) return;
    try {
      await goalApi.delete(id);
      toast.success("Goal deleted successfully");
      loadAreas();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete goal");
      setError(err.message);
    }
  };

  const closeDialog = () => {
    setDialogMode({ type: "none" });
    setError(null);
  };

  const getPriorityColor = (priority: GoalPriority) => {
    switch (priority) {
      case "critical":
        return "red";
      case "important":
        return "blue";
      case "growth":
        return "green";
      case "hobby":
        return "purple";
      default:
        return "gray";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-sm text-muted-foreground">Loading goals...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Goal Progress & Management</h3>
          <p className="text-sm text-muted-foreground">
            Track your goals and manage hierarchy
          </p>
        </div>
        <Button onClick={openCreateArea} size="sm">
          + New Area
        </Button>
      </div>

      {error && (
        <Card className="mb-4 border-destructive">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{error}</p>
            <Button size="sm" onClick={() => setError(null)} className="mt-2">
              Dismiss
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Areas List */}
      <div className="space-y-4">
        {areas.map((area) => (
          <Card key={area.id}>
            <CardContent className="pt-6">
              {/* Area Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleAreaExpansion(area.id)}
                    className="text-2xl hover:bg-accent p-1 rounded"
                  >
                    {expandedAreas.has(area.id) ? "▼" : "▶"}
                  </button>
                  <div className="text-2xl">{area.icon}</div>
                  <div>
                    <p className="text-xl font-bold">{area.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {area.categories?.length || 0} categories
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    onClick={() => openCreateCategory(area.id)}
                    variant="secondary"
                  >
                    + Category
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => openEditArea(area)}
                    variant="secondary"
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleDeleteArea(area.id)}
                    variant="destructive"
                  >
                    Delete
                  </Button>
                </div>
              </div>

              {/* Categories (when expanded) */}
              {expandedAreas.has(area.id) && area.categories && (
                <div className="ml-8 space-y-3">
                  {area.categories.map((category) => (
                    <Card key={category.id} className="bg-muted/50">
                      <CardContent className="pt-6">
                        {/* Category Header */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <p className="text-lg font-semibold">
                              📂 {category.name}
                            </p>
                            <Badge variant="secondary">
                              {category.goals?.length || 0} goals
                            </Badge>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              onClick={() => openCreateGoal(category.id)}
                              variant="secondary"
                            >
                              + Goal
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => openEditCategory(category)}
                              variant="secondary"
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleDeleteCategory(category.id)}
                              variant="destructive"
                            >
                              Delete
                            </Button>
                          </div>
                        </div>

                        {/* Goals */}
                        {category.goals && category.goals.length > 0 && (
                          <div className="ml-4 space-y-2">
                            {category.goals.map((goal) => (
                              <Card
                                key={goal.id}
                                className="bg-background border-l-4"
                                style={{
                                  borderLeftColor:
                                    getPriorityColor(goal.priority) === "red"
                                      ? "#ef4444"
                                      : getPriorityColor(goal.priority) ===
                                        "blue"
                                      ? "#3b82f6"
                                      : getPriorityColor(goal.priority) ===
                                        "green"
                                      ? "#10b981"
                                      : "#a855f7",
                                }}
                              >
                                <CardContent className="pt-6">
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <p className="font-semibold text-sm">
                                          🎯 {goal.name}
                                        </p>
                                        <Badge
                                          variant={
                                            getPriorityColor(goal.priority) ===
                                            "red"
                                              ? "destructive"
                                              : "default"
                                          }
                                        >
                                          {goal.priority}
                                        </Badge>
                                        {!goal.isActive && (
                                          <Badge variant="secondary">
                                            Inactive
                                          </Badge>
                                        )}
                                        <p className="text-xs text-muted-foreground">
                                          • {goal.targetHours}h/
                                          {goal.targetPeriod}
                                        </p>
                                      </div>
                                      {goal.purpose && (
                                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                                          {goal.purpose}
                                        </p>
                                      )}
                                      <div className="flex flex-wrap gap-1 mt-1 mb-2">
                                        {goal.tags.slice(0, 4).map((tag) => (
                                          <Badge
                                            key={tag}
                                            variant="outline"
                                            className="text-xs"
                                          >
                                            {tag}
                                          </Badge>
                                        ))}
                                        {goal.tags.length > 4 && (
                                          <Badge variant="secondary">
                                            +{goal.tags.length - 4}
                                          </Badge>
                                        )}
                                      </div>

                                      {/* Progress Section */}
                                      {progress.get(goal.id) && (
                                        <div className="mt-2 space-y-1">
                                          <div className="flex items-center justify-between text-xs">
                                            <span className="text-muted-foreground">
                                              {
                                                progress.get(goal.id)!
                                                  .actualHours
                                              }
                                              h / {goal.targetHours}h
                                            </span>
                                            <div className="flex items-center gap-1">
                                              <Badge
                                                variant={
                                                  progress.get(goal.id)!
                                                    .status === "ahead"
                                                    ? "default"
                                                    : progress.get(goal.id)!
                                                        .status === "on-track"
                                                    ? "secondary"
                                                    : progress.get(goal.id)!
                                                        .status === "behind"
                                                    ? "outline"
                                                    : "destructive"
                                                }
                                                className="text-xs"
                                              >
                                                {
                                                  progress.get(goal.id)!
                                                    .progressPercentage
                                                }
                                                %
                                              </Badge>
                                              <span className="text-muted-foreground">
                                                (
                                                {
                                                  progress.get(goal.id)!
                                                    .matchedTracksCount
                                                }{" "}
                                                tracks)
                                              </span>
                                            </div>
                                          </div>
                                          <div className="w-full bg-muted rounded-full h-1.5">
                                            <div
                                              className={`h-full rounded-full transition-all ${
                                                progress.get(goal.id)!
                                                  .status === "ahead"
                                                  ? "bg-green-500"
                                                  : progress.get(goal.id)!
                                                      .status === "on-track"
                                                  ? "bg-blue-500"
                                                  : progress.get(goal.id)!
                                                      .status === "behind"
                                                  ? "bg-yellow-500"
                                                  : progress.get(goal.id)!
                                                      .status === "neglected"
                                                  ? "bg-orange-500"
                                                  : "bg-red-500"
                                              }`}
                                              style={{
                                                width: `${Math.min(
                                                  100,
                                                  progress.get(goal.id)!
                                                    .progressPercentage
                                                )}%`,
                                              }}
                                            />
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex gap-1 shrink-0">
                                      <Button
                                        size="sm"
                                        onClick={() => openEditGoal(goal)}
                                        variant="secondary"
                                      >
                                        Edit
                                      </Button>
                                      <Button
                                        size="sm"
                                        onClick={() =>
                                          handleDeleteGoal(goal.id)
                                        }
                                        variant="destructive"
                                      >
                                        Delete
                                      </Button>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Area Dialog */}
      <Dialog
        open={dialogMode.type === "area"}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogMode.type === "area" && dialogMode.mode === "create"
                ? "Create Area"
                : "Edit Area"}
            </DialogTitle>
            <DialogDescription>
              Areas represent high-level life domains
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="area-name">Name</Label>
              <Input
                id="area-name"
                value={areaForm.name}
                onChange={(e) =>
                  setAreaForm({ ...areaForm, name: e.target.value })
                }
                placeholder="e.g., Programming, Hobbies"
              />
            </div>
            <div>
              <Label htmlFor="area-icon">Icon (emoji)</Label>
              <Input
                id="area-icon"
                value={areaForm.icon}
                onChange={(e) =>
                  setAreaForm({ ...areaForm, icon: e.target.value })
                }
                placeholder="📁"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={closeDialog}>
              Cancel
            </Button>
            <Button onClick={handleSaveArea}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog
        open={dialogMode.type === "category"}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogMode.type === "category" && dialogMode.mode === "create"
                ? "Create Category"
                : "Edit Category"}
            </DialogTitle>
            <DialogDescription>
              Categories group related goals within an area
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="category-name">Name</Label>
              <Input
                id="category-name"
                value={categoryForm.name}
                onChange={(e) =>
                  setCategoryForm({ ...categoryForm, name: e.target.value })
                }
                placeholder="e.g., DSA, Backend, Fitness"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={closeDialog}>
              Cancel
            </Button>
            <Button onClick={handleSaveCategory}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Goal Dialog */}
      <Dialog
        open={dialogMode.type === "goal"}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialogMode.type === "goal" && dialogMode.mode === "create"
                ? "Create Goal"
                : "Edit Goal"}
            </DialogTitle>
            <DialogDescription>
              Define a specific, measurable goal with purpose
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="goal-name">Name *</Label>
              <Input
                id="goal-name"
                value={goalForm.name}
                onChange={(e) =>
                  setGoalForm({ ...goalForm, name: e.target.value })
                }
                placeholder="e.g., LeetCode Interview Prep"
              />
            </div>
            <div>
              <Label htmlFor="goal-purpose">Purpose (the "why")</Label>
              <Textarea
                id="goal-purpose"
                value={goalForm.purpose}
                onChange={(e) =>
                  setGoalForm({ ...goalForm, purpose: e.target.value })
                }
                placeholder="Why does this goal matter? What will you achieve?"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="goal-priority">Priority</Label>
                <Select
                  value={goalForm.priority}
                  onValueChange={(value) =>
                    setGoalForm({
                      ...goalForm,
                      priority: value as GoalPriority,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="important">Important</SelectItem>
                    <SelectItem value="growth">Growth</SelectItem>
                    <SelectItem value="hobby">Hobby</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="goal-target-period">Target Period</Label>
                <Select
                  value={goalForm.targetPeriod}
                  onValueChange={(value) =>
                    setGoalForm({
                      ...goalForm,
                      targetPeriod: value as TargetPeriod,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="goal-target-hours">Target Hours *</Label>
                <Input
                  id="goal-target-hours"
                  type="number"
                  min="0"
                  step="0.5"
                  value={goalForm.targetHours}
                  onChange={(e) =>
                    setGoalForm({
                      ...goalForm,
                      targetHours: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="goal-minimum-daily">
                  Minimum Daily (optional)
                </Label>
                <Input
                  id="goal-minimum-daily"
                  type="number"
                  min="0"
                  step="0.25"
                  value={goalForm.minimumDaily}
                  onChange={(e) =>
                    setGoalForm({ ...goalForm, minimumDaily: e.target.value })
                  }
                  placeholder="For no-zero-days"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="goal-tags">Tags (comma-separated) *</Label>
              <Input
                id="goal-tags"
                value={goalForm.tags}
                onChange={(e) =>
                  setGoalForm({ ...goalForm, tags: e.target.value })
                }
                placeholder="e.g., DSA-Practice, Leetcode, Coding"
              />
              <p className="text-xs text-muted-foreground mt-1">
                These tags will map to your Toggl time entries
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="goal-start-date">Start Date (optional)</Label>
                <Input
                  id="goal-start-date"
                  type="date"
                  value={goalForm.startDate}
                  onChange={(e) =>
                    setGoalForm({ ...goalForm, startDate: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="goal-deadline">Deadline (optional)</Label>
                <Input
                  id="goal-deadline"
                  type="date"
                  value={goalForm.deadline}
                  onChange={(e) =>
                    setGoalForm({ ...goalForm, deadline: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="goal-active"
                checked={goalForm.isActive}
                onChange={(e) =>
                  setGoalForm({ ...goalForm, isActive: e.target.checked })
                }
              />
              <Label htmlFor="goal-active" className="cursor-pointer">
                Active (track progress)
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={closeDialog}>
              Cancel
            </Button>
            <Button onClick={handleSaveGoal}>Save Goal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
