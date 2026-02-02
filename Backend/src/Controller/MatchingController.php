<?php

namespace App\Controller;

use App\Entity\UserInventory;
use App\Repository\RecipeRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

final class MatchingController extends AbstractController
{
    #[Route('/api/matching', name: 'api_matching', methods: ['GET'])]
    public function index(
        RecipeRepository $recipeRepository,
        EntityManagerInterface $em
    ): JsonResponse {
        $user = $this->getUser();
        if (!$user) {
            return $this->json(['message' => 'Unauthorized'], 401);
        }

        // 1) Inventaire utilisateur (avec ingredient)
        /** @var UserInventory[] $inventories */
        $inventories = $em->getRepository(UserInventory::class)->findBy(['user' => $user]);

        // Map ingredient_id => inventory item
        $inventoryByIngredientId = [];
        foreach ($inventories as $inv) {
            $ingredient = $inv->getIngredient();
            if ($ingredient) {
                $inventoryByIngredientId[$ingredient->getId()] = $inv;
            }
        }

        // 2) Recettes + ingrédients (pivot)
        $recipes = $recipeRepository->findAllWithRecipeIngredients();

        $results = [];

        foreach ($recipes as $recipe) {
            $recipeIngredients = $recipe->getRecipeIngredients();
            $total = count($recipeIngredients);

            if ($total === 0) {
                continue; // recette sans ingrédients => on ignore
            }

            $have = [];
            $missing = [];

            $matched = 0;

            foreach ($recipeIngredients as $ri) {
                $ingredient = $ri->getIngredient();
                if (!$ingredient) {
                    continue;
                }

                $ingredientId = $ingredient->getId();
                $inv = $inventoryByIngredientId[$ingredientId] ?? null;

                $requiredQty = $ri->getQuantity(); // peut être null pour l’instant
                $requiredUnit = $ri->getUnit();

                if (!$inv) {
                    // absent du frigo
                    $missing[] = [
                        'ingredientId' => $ingredientId,
                        'name' => $ingredient->getName(),
                        'requiredQuantity' => $requiredQty,
                        'requiredUnit' => $requiredUnit,
                        'reason' => 'absent',
                    ];
                    continue;
                }

                // présent dans le frigo
                $invQty = $inv->getQuantity();
                $invUnit = $inv->getUnit(); // inventaire stocke quantity+unit :contentReference[oaicite:4]{index=4}

                // Si la recette n’a pas encore de quantité requise (NULL), on considère OK
                if ($requiredQty === null) {
                    $matched++;
                    $have[] = [
                        'ingredientId' => $ingredientId,
                        'name' => $ingredient->getName(),
                        'status' => 'ok',
                        'inventoryQuantity' => $invQty,
                        'inventoryUnit' => $invUnit,
                        'requiredQuantity' => null,
                        'requiredUnit' => $requiredUnit,
                        'message' => 'Quantité requise non renseignée',
                    ];
                    continue;
                }

                // Quantité requise connue : on compare
                $sameUnit = ($requiredUnit === null) || (mb_strtolower($requiredUnit) === mb_strtolower($invUnit));
                if (!$sameUnit) {
                    // unité différente => on considère comme manquant (à améliorer plus tard avec conversions)
                    $missing[] = [
                        'ingredientId' => $ingredientId,
                        'name' => $ingredient->getName(),
                        'requiredQuantity' => $requiredQty,
                        'requiredUnit' => $requiredUnit,
                        'reason' => 'unite_differente',
                        'inventoryQuantity' => $invQty,
                        'inventoryUnit' => $invUnit,
                    ];
                    continue;
                }

                if ($invQty >= $requiredQty) {
                    $matched++;
                    $have[] = [
                        'ingredientId' => $ingredientId,
                        'name' => $ingredient->getName(),
                        'status' => 'ok',
                        'inventoryQuantity' => $invQty,
                        'inventoryUnit' => $invUnit,
                        'requiredQuantity' => $requiredQty,
                        'requiredUnit' => $requiredUnit,
                        'message' => 'Quantité suffisante',
                    ];
                } else {
                    $missing[] = [
                        'ingredientId' => $ingredientId,
                        'name' => $ingredient->getName(),
                        'requiredQuantity' => $requiredQty,
                        'requiredUnit' => $requiredUnit,
                        'reason' => 'quantite_insuffisante',
                        'inventoryQuantity' => $invQty,
                        'inventoryUnit' => $invUnit,
                    ];
                }
            }

            $score = (int) round(($matched / $total) * 100);

            if ($score < 40) {
                continue; // filtre <50% comme ton US :contentReference[oaicite:5]{index=5}
            }

            $label = match (true) {
                $score === 100 => '✅ Réalisable maintenant',
                $score >= 75 => '⚠️ Presque réalisable',
                $score >= 50 => '💡 Il manque peu de choses',
                default => '❌ Trop d\'ingrédients manquants',
            };

            $results[] = [
                'recipe' => [
                    'id' => $recipe->getId(),
                    'title' => $recipe->getTitle(),
                    'prepTime' => $recipe->getPrepTime(),
                    'imageUrl' => $recipe->getImageUrl(),
                ],
                'score' => $score,
                'label' => $label,
                'have' => $have,
                'missing' => $missing,
                'totalIngredients' => $total,
                'matchedIngredients' => $matched,
            ];
        }

        // Tri score décroissant
        usort($results, fn($a, $b) => $b['score'] <=> $a['score']);

        return $this->json([
  'debug' => [
    'inventoryCount' => count($inventories),
    'recipesCount' => count($recipes),
  ],
  'count' => count($results),
  'results' => $results,
]);

    }
}
