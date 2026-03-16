import { useMemo, useState } from "react";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { FieldLabel, TextArea, TextInput } from "../components/Field";
import { ErrorState, LoadingState } from "../components/StatusMessage";
import type { Ingredient, IngredientPayload } from "../types";

const initialForm: IngredientPayload = {
  name: "",
  description: "",
  is_active: true,
};

export function IngredientsPage({
  ingredients,
  loading,
  error,
  busyAction,
  onCreate,
  onUpdate,
  onDelete,
}: {
  ingredients: Ingredient[];
  loading: boolean;
  error: { message: string } | null;
  busyAction: string | null;
  onCreate: (payload: IngredientPayload) => Promise<unknown>;
  onUpdate: (id: number, payload: Partial<IngredientPayload>) => Promise<unknown>;
  onDelete: (id: number) => Promise<unknown>;
}) {
  const [form, setForm] = useState<IngredientPayload>(initialForm);
  const [editingId, setEditingId] = useState<number | null>(null);

  const editingIngredient = useMemo(
    () => ingredients.find((ingredient) => ingredient.id === editingId) ?? null,
    [ingredients, editingId],
  );

  if (loading && ingredients.length === 0) {
    return <LoadingState label="Loading ingredients..." />;
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <Card title={editingIngredient ? "Edit Ingredient" : "Create Ingredient"} subtitle="Manage cocktail ingredients stored in SQLite.">
        {error && <ErrorState message={error.message} />}
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (editingIngredient) {
              void onUpdate(editingIngredient.id, form).then(() => {
                setEditingId(null);
                setForm(initialForm);
              });
              return;
            }
            void onCreate(form).then(() => setForm(initialForm));
          }}
        >
          <div>
            <FieldLabel label="Name" />
            <TextInput
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Vodka"
              required
            />
          </div>
          <div>
            <FieldLabel label="Description" />
            <TextArea
              value={form.description ?? ""}
              rows={4}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              placeholder="Neutral spirit"
            />
          </div>
          <label className="flex items-center gap-3 text-sm font-semibold">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))}
            />
            Ingredient is active
          </label>
          <div className="flex gap-3">
            <Button type="submit" disabled={busyAction === "create-ingredient" || busyAction?.startsWith("update-ingredient-")}>
              {editingIngredient ? "Save Ingredient" : "Create Ingredient"}
            </Button>
            {editingIngredient && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setEditingId(null);
                  setForm(initialForm);
                }}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </Card>

      <Card title="Ingredient List" subtitle={`${ingredients.length} ingredients configured.`}>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-midnight/55">
              <tr>
                <th className="pb-3">Name</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Description</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {ingredients.map((ingredient) => (
                <tr key={ingredient.id} className="border-t border-midnight/10 align-top">
                  <td className="py-3 font-semibold">{ingredient.name}</td>
                  <td className="py-3">{ingredient.is_active ? "Enabled" : "Disabled"}</td>
                  <td className="py-3 text-midnight/65">{ingredient.description || "No description"}</td>
                  <td className="py-3">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setEditingId(ingredient.id);
                          setForm({
                            name: ingredient.name,
                            description: ingredient.description ?? "",
                            is_active: ingredient.is_active,
                          });
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => void onUpdate(ingredient.id, { is_active: !ingredient.is_active })}
                        disabled={busyAction === `update-ingredient-${ingredient.id}`}
                      >
                        {ingredient.is_active ? "Disable" : "Enable"}
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => void onDelete(ingredient.id)}
                        disabled={busyAction === `delete-ingredient-${ingredient.id}`}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
