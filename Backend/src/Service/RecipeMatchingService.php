<?php

namespace App\Service;

use App\Entity\Recipe;
use App\Entity\RecipeIngredient;
use App\Entity\UserInventory;

final class RecipeMatchingService
{
    public const int MIN_SCORE = 40;

    /**
     * @param Recipe[] $recipes
     * @param UserInventory[] $inventories
     * @return array<int, array<string, mixed>>
     */
    public function matchRecipes(array $recipes, array $inventories): array
    {
        $inventoryByIngredientId = $this->indexInventoryByIngredientId($inventories);

        $results = [];
        foreach ($recipes as $recipe) {
            $result = $this->matchRecipe($recipe, $inventoryByIngredientId);
            if ($result === null) {
                continue;
            }

            if ($result['score'] < self::MIN_SCORE) {
                continue;
            }

            $results[] = $result;
        }

        usort($results, fn ($a, $b) => $b['score'] <=> $a['score']);

        return $results;
    }

    /**
     * @param UserInventory[] $inventories
     * @return array<int, UserInventory>
     */
    private function indexInventoryByIngredientId(array $inventories): array
    {
        $inventoryByIngredientId = [];
        foreach ($inventories as $inv) {
            $ingredient = $inv->getIngredient();
            if ($ingredient) {
                $inventoryByIngredientId[$ingredient->getId()] = $inv;
            }
        }

        return $inventoryByIngredientId;
    }

    /**
     * @param array<int, UserInventory> $inventoryByIngredientId
     * @return array<string, mixed>|null
     */
    private function matchRecipe(Recipe $recipe, array $inventoryByIngredientId): ?array
    {
        $recipeIngredients = $recipe->getRecipeIngredients();
        $total = count($recipeIngredients);
        if ($total === 0) {
            return null;
        }

        $have = [];
        $missing = [];
        $matched = 0;

        /** @var RecipeIngredient $ri */
        foreach ($recipeIngredients as $ri) {
            $evaluation = $this->evaluateRecipeIngredient($ri, $inventoryByIngredientId);
            if ($evaluation === null) {
                continue;
            }

            if ($evaluation['bucket'] === 'have') {
                $matched++;
                $have[] = $evaluation['data'];
                continue;
            }

            $missing[] = $evaluation['data'];
        }

        $score = (int) round(($matched / $total) * 100);

        return [
            'recipe' => [
                'id' => $recipe->getId(),
                'title' => $recipe->getTitle(),
                'prepTime' => $recipe->getPrepTime(),
                'imageUrl' => $recipe->getImageUrl(),
            ],
            'score' => $score,
            'label' => $this->labelForScore($score),
            'have' => $have,
            'missing' => $missing,
            'totalIngredients' => $total,
            'matchedIngredients' => $matched,
        ];
    }

    /**
     * @param array<int, UserInventory> $inventoryByIngredientId
     * @return array{bucket: 'have'|'missing', data: array<string, mixed>}|null
     */
    private function evaluateRecipeIngredient(RecipeIngredient $ri, array $inventoryByIngredientId): ?array
    {
        $ingredient = $ri->getIngredient();
        if (!$ingredient) {
            return null;
        }

        $ingredientId = $ingredient->getId();
        $inv = $inventoryByIngredientId[$ingredientId] ?? null;

        $requiredQty = $ri->getQuantity();
        $requiredUnit = $ri->getUnit();

        if (!$inv) {
            return [
                'bucket' => 'missing',
                'data' => [
                    'ingredientId' => $ingredientId,
                    'name' => $ingredient->getName(),
                    'requiredQuantity' => $requiredQty,
                    'requiredUnit' => $requiredUnit,
                    'reason' => 'absent',
                ],
            ];
        }

        $invQty = $inv->getQuantity();
        $invUnit = $inv->getUnit();

        if ($requiredQty === null) {
            return [
                'bucket' => 'have',
                'data' => [
                    'ingredientId' => $ingredientId,
                    'name' => $ingredient->getName(),
                    'status' => 'ok',
                    'inventoryQuantity' => $invQty,
                    'inventoryUnit' => $invUnit,
                    'requiredQuantity' => null,
                    'requiredUnit' => $requiredUnit,
                    'message' => 'Quantité requise non renseignée',
                ],
            ];
        }

        $sameUnit = ($requiredUnit === null) || (mb_strtolower($requiredUnit) === mb_strtolower($invUnit));
        if (!$sameUnit) {
            return [
                'bucket' => 'missing',
                'data' => [
                    'ingredientId' => $ingredientId,
                    'name' => $ingredient->getName(),
                    'requiredQuantity' => $requiredQty,
                    'requiredUnit' => $requiredUnit,
                    'reason' => 'unite_differente',
                    'inventoryQuantity' => $invQty,
                    'inventoryUnit' => $invUnit,
                ],
            ];
        }

        if ($invQty >= $requiredQty) {
            return [
                'bucket' => 'have',
                'data' => [
                    'ingredientId' => $ingredientId,
                    'name' => $ingredient->getName(),
                    'status' => 'ok',
                    'inventoryQuantity' => $invQty,
                    'inventoryUnit' => $invUnit,
                    'requiredQuantity' => $requiredQty,
                    'requiredUnit' => $requiredUnit,
                    'message' => 'Quantité suffisante',
                ],
            ];
        }

        return [
            'bucket' => 'missing',
            'data' => [
                'ingredientId' => $ingredientId,
                'name' => $ingredient->getName(),
                'requiredQuantity' => $requiredQty,
                'requiredUnit' => $requiredUnit,
                'reason' => 'quantite_insuffisante',
                'inventoryQuantity' => $invQty,
                'inventoryUnit' => $invUnit,
            ],
        ];
    }

    private function labelForScore(int $score): string
    {
        return match (true) {
            $score === 100 => '✅ Réalisable maintenant',
            $score >= 75 => '⚠️ Presque réalisable',
            $score >= 50 => '💡 Il manque peu de choses',
            default => '❌ Trop d\'ingrédients manquants',
        };
    }
}
