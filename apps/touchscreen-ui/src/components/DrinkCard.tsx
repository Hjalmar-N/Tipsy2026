import { Card } from "./Card";
import { Button } from "./Button";
import type { RecipeAvailability } from "../types";
import { getDrinkImageUrl } from "../drinkImages";

export function DrinkCard({
  recipe,
  onSelect,
  featured,
}: {
  recipe: RecipeAvailability;
  onSelect: () => void;
  featured?: boolean;
}) {
  const imageUrl = getDrinkImageUrl(recipe.name);

  return (
    <Card
      className={`flex flex-col overflow-hidden p-0 transition touch-manipulation ${featured ? "ring-2 ring-lime/80" : ""}`}
    >
      <div className="relative h-36 bg-[#16364b]">
        {imageUrl ? (
          <img src={imageUrl} alt={recipe.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_top,#d95d39,transparent_45%),linear-gradient(135deg,#0d2434,#16364b)] text-4xl font-display text-white/85">
            {recipe.name.slice(0, 1)}
          </div>
        )}
      </div>
      <div className="flex flex-col p-4">
        <h3 className="font-display text-2xl text-white">{recipe.name}</h3>
        <p className="mt-1 line-clamp-2 text-base text-white/75">
          {recipe.description || "Tap to choose size and pour."}
        </p>
        <Button className="mt-4 w-full min-h-[72px]" onClick={onSelect}>
          Select
        </Button>
      </div>
    </Card>
  );
}
