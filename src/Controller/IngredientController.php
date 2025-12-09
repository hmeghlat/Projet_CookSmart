<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Doctrine\ORM\EntityManagerInterface;
use App\Entity\Ingredient;
use App\Repository\IngredientRepository;
use Symfony\Component\HttpFoundation\Response;

final class IngredientController extends AbstractController
{
    #[Route('/api/ingredients', name: 'ingredients_list', methods: ['GET'])]
    public function getAllingredient(IngredientRepository $ingredientRepository): JsonResponse
    {
        $listIngredients = $ingredientRepository->findAll();
        return $this->json(
            ['listIngredients'=>$listIngredients],
            Response::HTTP_OK,
            [],
        );
    }
}
