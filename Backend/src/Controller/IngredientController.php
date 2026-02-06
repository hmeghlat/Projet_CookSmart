<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Doctrine\ORM\EntityManagerInterface;
use App\Entity\Ingredient;
use App\Repository\IngredientRepository;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

final class IngredientController extends AbstractController
{
    // #[Route('/api/ingredients', name: 'ingredients_list', methods: ['GET'])]
    // public function getAllingredient(IngredientRepository $ingredientRepository): JsonResponse
    // {
    //     $listIngredients = $ingredientRepository->findAll();

    //     return $this->json(
    //         ['listIngredients' => $listIngredients],
    //         Response::HTTP_OK,
    //         [],
    //         ['groups' => ['ingredient:read']]
    //     );
    // }

    #[Route('/api/ingredients/search', name: 'ingredients_search', methods: ['GET'])]
    public function search(IngredientRepository $ingredientRepository, Request $request): JsonResponse
    {
        $query = $request->query->get('q', '');
        
        if (empty($query) || strlen($query) < 2) {
            return $this->json(
                ['ingredients' => []],
                Response::HTTP_OK,
                [],
                ['groups' => ['ingredient:read']]
            );
        }

        // Recherche par nom (insensible à la casse)
        $ingredients = $ingredientRepository->createQueryBuilder('i')
            ->where('LOWER(i.name) LIKE LOWER(:query)')
            ->setParameter('query', '%' . $query . '%')
            ->setMaxResults(10)
            ->getQuery()
            ->getResult();

        return $this->json(
            ['ingredients' => $ingredients],
            Response::HTTP_OK,
            [],
            ['groups' => ['ingredient:read']]
        );
    }
}
