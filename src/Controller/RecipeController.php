<?php

namespace App\Controller;

use App\Repository\RecipeRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

final class RecipeController extends AbstractController
{
    #[Route('/api/recipes', name: 'recipes_list', methods: ['GET'])]
    public function list(
        RecipeRepository $recipeRepository,
        Request $request
    ): JsonResponse {
        $user = $this->getUser();
        if (!$user) {
            return $this->json(['error' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);
        }

        // Récupération des paramètres de recherche et filtres
        $search = $request->query->get('search', '');
        $difficulty = $request->query->get('difficulty', '');
        $timeMin = $request->query->get('timeMin', null);
        $timeMax = $request->query->get('timeMax', null);

        // Construction de la requête
        $qb = $recipeRepository->createQueryBuilder('r');

        // Filtre par recherche (titre)
        if (!empty($search)) {
            $qb->andWhere('LOWER(r.title) LIKE LOWER(:search)')
                ->setParameter('search', '%' . $search . '%');
        }

        // Filtre par difficulté (si le champ existe dans l'entité)
        // Pour l'instant, on ignore car le champ n'existe pas encore
        // if (!empty($difficulty)) {
        //     $qb->andWhere('r.difficulty = :difficulty')
        //         ->setParameter('difficulty', $difficulty);
        // }

        // Filtre par temps de préparation
        if ($timeMin !== null) {
            $qb->andWhere('r.prepTime >= :timeMin')
                ->setParameter('timeMin', (int) $timeMin);
        }

        if ($timeMax !== null) {
            $qb->andWhere('r.prepTime <= :timeMax')
                ->setParameter('timeMax', (int) $timeMax);
        }

        $recipes = $qb->orderBy('r.createdAt', 'DESC')
            ->getQuery()
            ->getResult();

        return $this->json(
            [
                'recipes' => $recipes,
                'total' => count($recipes),
            ],
            Response::HTTP_OK,
            [],
            ['groups' => ['recipe:read']]
        );
    }

    #[Route('/api/recipes/{id}', name: 'recipe_detail', methods: ['GET'])]
    public function detail(
        int $id,
        RecipeRepository $recipeRepository
    ): JsonResponse {
        $user = $this->getUser();
        if (!$user) {
            return $this->json(['error' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);
        }

        $recipe = $recipeRepository->find($id);
        if (!$recipe) {
            return $this->json(
                ['error' => 'Recette introuvable'],
                Response::HTTP_NOT_FOUND
            );
        }

        return $this->json(
            $recipe,
            Response::HTTP_OK,
            [],
            ['groups' => ['recipe:read']]
        );
    }
}
