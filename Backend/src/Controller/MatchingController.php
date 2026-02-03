<?php

namespace App\Controller;

use App\Entity\UserInventory;
use App\Repository\RecipeRepository;
use App\Service\RecipeMatchingService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

final class MatchingController extends AbstractController
{
    #[Route('/api/matching', name: 'api_matching', methods: ['GET'])]
    public function index(
        RecipeRepository $recipeRepository,
        EntityManagerInterface $em,
        RecipeMatchingService $matchingService
    ): JsonResponse {
        $user = $this->getUser();
        if (!$user) {
            return $this->json(['message' => 'Unauthorized'], 401);
        }

        // 1) Inventaire utilisateur (avec ingredient)
        /** @var UserInventory[] $inventories */
        $inventories = $em->getRepository(UserInventory::class)->findBy(['user' => $user]);

        // 2) Recettes + ingrédients (pivot)
        $recipes = $recipeRepository->findAllWithRecipeIngredients();

        $results = $matchingService->matchRecipes($recipes, $inventories);

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
