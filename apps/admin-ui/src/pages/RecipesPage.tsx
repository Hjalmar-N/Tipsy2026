import { useMemo, useState } from "react";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { FieldLabel, SelectInput, TextArea, TextInput } from "../components/Field";
import { SectionHeading } from "../components/SectionHeading";
import { ErrorState, LoadingState } from "../components/StatusMessage";
import type { Ingredient, Recipe, RecipeAvailability, RecipePayload } from "../types";

const emptyRecipeForm = (): RecipePayload => ({
  name: "",
  description: "",
  is_active: true,
  ingredients: [{ ingredient_id: 0, amount_ml: 0, step_order: 0 }],
});

export function RecipesPage({
  recipes,
  ingredients,
  loading,
  error,
  busyAction,
  recipeAvailabilityMap,
  onCreate,
  onUpdate,
  onDelete,
}: {
  recipes: Recipe[];
  ingredients: Ingredient[];
  loading: boolean;
  error: { message: string } | null;
  busyAction: string | null;
  recipeAvailabilityMap: Map<number, RecipeAvailability>;
  onCreate: (payload: RecipePayload) => Promise<unknown>;
  onUpdate: (id: number, payload: Partial<RecipePayload>) => Promise<unknown>;
  onDelete: (id: number) => Promise<unknown>;
}) {
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [form, setForm] = useState<RecipePayload>(emptyRecipeForm);
  const [localError, setLocalError] = useState<string | null>(null);

  const ingredientOptions = useMemo(() => ingredients.filter((ingredient) => ingredient.is_active), [ingredients]);

  if (loading && recipes.length === 0) {
    return <LoadingState label="Loading recipes..." />;
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <Card title={editingRecipe ? "Edit Recipe" : "Create Recipe"} subtitle="Recipes are only available when all ingredients map to enabled pumps.">
        {(error || localError) && <ErrorState message={localError ?? error?.message ?? ""} />}
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            const payload = {
              ...form,
              ingredients: form.ingredients
                .filter((item) => item.ingredient_id > 0 && item.amount_ml > 0)
                .map((item, index) => ({ ...item, step_order: index })),
            };
            if (!payload.name.trim()) {
              setLocalError("Recipe name is required.");
              return;
            }
            if (payload.ingredients.length === 0) {
              setLocalError("Add at least one ingredient with a valid amount.");
              return;
            }
            setLocalError(null);
            if (editingRecipe) {
              void onUpdate(editingRecipe.id, payload).then(() => {
                setEditingRecipe(null);
                setForm(emptyRecipeForm());
              });
              return;
            }
            void onCreate(payload).then(() => setForm(emptyRecipeForm()));
          }}
        >
          <div>
            <FieldLabel label="Recipe name" />
            <TextInput value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required />
          </div>
          <div>
            <FieldLabel label="Description" />
            <TextArea rows={3} value={form.description ?? ""} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
          </div>
          <label className="flex items-center gap-3 text-sm font-semibold">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))}
            />
            Recipe is active
          </label>
          <div className="space-y-3">
            <SectionHeading
              eyebrow="Composition"
              title="Recipe ingredients"
              detail="Ingredient order controls pour order. Only active ingredients are offered here."
            />
            {form.ingredients.map((item, index) => (
              <div key={index} className="grid gap-3 rounded-2xl bg-slatepaper p-3 md:grid-cols-[1fr_160px_auto]">
                <SelectInput
                  value={item.ingredient_id || ""}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      ingredients: current.ingredients.map((entry, itemIndex) =>
                        itemIndex === index ? { ...entry, ingredient_id: Number(event.target.value) } : entry,
                      ),
                    }))
                  }
                >
                  <option value="">Choose ingredient</option>
                  {ingredientOptions.map((ingredient) => (
                    <option key={ingredient.id} value={ingredient.id}>
                      {ingredient.name}
                    </option>
                  ))}
                </SelectInput>
                <TextInput
                  type="number"
                  min="1"
                  step="1"
                  placeholder="ml"
                  value={item.amount_ml || ""}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      ingredients: current.ingredients.map((entry, itemIndex) =>
                        itemIndex === index ? { ...entry, amount_ml: Number(event.target.value) } : entry,
                      ),
                    }))
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      ingredients: current.ingredients.filter((_, itemIndex) => itemIndex !== index),
                    }))
                  }
                  disabled={form.ingredients.length === 1}
                >
                  Remove
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                setForm((current) => ({
                  ...current,
                  ingredients: [...current.ingredients, { ingredient_id: 0, amount_ml: 0, step_order: current.ingredients.length }],
                }))
              }
            >
              Add Ingredient
            </Button>
          </div>
          <div className="flex gap-3">
            <Button type="submit" disabled={busyAction === "create-recipe" || busyAction?.startsWith("update-recipe-")}>
              {editingRecipe ? "Save Recipe" : "Create Recipe"}
            </Button>
            {editingRecipe && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setEditingRecipe(null);
                  setForm(emptyRecipeForm());
                }}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </Card>

      <Card title="Recipe List" subtitle={`${recipes.length} recipes defined.`}>
        <div className="space-y-4">
          {recipes.map((recipe) => {
            const availability = recipeAvailabilityMap.get(recipe.id);
            return (
              <div key={recipe.id} className="rounded-[1.5rem] bg-slatepaper p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xl font-semibold">{recipe.name}</h3>
                      <Badge tone={availability?.can_make ? "good" : "warn"}>
                        {availability?.can_make ? "Available" : "Unavailable"}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-midnight/65">{recipe.description || "No description"}</p>
                    <div className="mt-3 text-sm text-midnight/75">
                      {recipe.ingredients.map((item) => `${item.ingredient.name} ${item.amount_ml}ml`).join(" • ")}
                    </div>
                    {!!availability?.missing_ingredient_ids.length && (
                      <div className="mt-3 rounded-xl bg-[#fff0c7] px-3 py-2 text-xs text-[#7b5c00]">
                        Missing enabled pump mappings for ingredient IDs: {availability.missing_ingredient_ids.join(", ")}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setEditingRecipe(recipe);
                        setForm({
                          name: recipe.name,
                          description: recipe.description ?? "",
                          is_active: recipe.is_active,
                          ingredients: recipe.ingredients.map((item, index) => ({
                            ingredient_id: item.ingredient_id,
                            amount_ml: item.amount_ml,
                            step_order: index,
                          })),
                        });
                      }}
                    >
                      Edit
                    </Button>
                    <Button variant="danger" onClick={() => void onDelete(recipe.id)} disabled={busyAction === `delete-recipe-${recipe.id}`}>
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
