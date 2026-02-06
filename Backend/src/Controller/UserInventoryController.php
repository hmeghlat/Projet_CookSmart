<?php

namespace App\Controller;

use App\Entity\Ingredient;
use App\Entity\UserInventory;
use App\Repository\IngredientRepository;
use App\Repository\UserInventoryRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;

final class UserInventoryController extends AbstractController
{
    #[Route('/api/inventories', name: 'user_inventories_liste', methods: ['GET'])]
    public function index(UserInventoryRepository $repo): JsonResponse
    {
        $user = $this->getUser();
        if (!$user) {
            return $this->json(['error' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);
        }

        $inventories = $repo->findBy(['user' => $user], ['expDate' => 'ASC']);

        return $this->json($inventories, Response::HTTP_OK, [], ['groups' => ['inventory:read']]);
    }

    #[Route('/api/inventory/add', name: 'inventory_add', methods: ['POST'])]
    public function add(
        Request $request,
        EntityManagerInterface $em,
        IngredientRepository $ingredientRepository,
        ValidatorInterface $validator
    ): JsonResponse {
        $user = $this->getUser();
        if (!$user) {
            return $this->json(['error' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);
        }

        $data = json_decode($request->getContent(), true);
        if (!is_array($data)) {
            return $this->json(['error' => 'Corps de requête invalide'], Response::HTTP_BAD_REQUEST);
        }

        // Vérification des champs requis
        if (!isset($data['ingredient_id']) || !isset($data['quantity']) || !isset($data['unit'])) {
            return $this->json(
                ['error' => 'Champs manquants (ingredient_id, quantity, unit requis)'],
                Response::HTTP_BAD_REQUEST
            );
        }

        // Récupération de l'ingrédient
        $ingredient = $ingredientRepository->find($data['ingredient_id']);
        if (!$ingredient) {
            return $this->json(
                ['error' => 'Ingrédient introuvable'],
                Response::HTTP_NOT_FOUND
            );
        }

        // Création de l'inventaire
        $inventory = new UserInventory();
        $inventory->setUser($user);
        $inventory->setIngredient($ingredient);
        $inventory->setQuantity((float) $data['quantity']);
        $inventory->setUnit((string) $data['unit']);
        $inventory->setAddedAt(new \DateTimeImmutable());

        // Date d'expiration optionnelle
        if (!empty($data['exp_date'])) {
            try {
                $expDate = new \DateTime($data['exp_date']);
                $inventory->setExpDate($expDate);
            } catch (\Exception $e) {
                return $this->json(
                    ['error' => 'Format de date invalide pour exp_date (attendu: YYYY-MM-DD)'],
                    Response::HTTP_BAD_REQUEST
                );
            }
        }

        // Validation
        $errors = $validator->validate($inventory);
        if (count($errors) > 0) {
            $errorsArray = [];
            foreach ($errors as $error) {
                $errorsArray[$error->getPropertyPath()][] = $error->getMessage();
            }

            return $this->json(
                [
                    'error' => 'Données invalides',
                    'details' => $errorsArray,
                ],
                Response::HTTP_BAD_REQUEST
            );
        }

        try {
            $em->persist($inventory);
            $em->flush();
        } catch (\Exception $e) {
            return $this->json(
                [
                    'error' => 'Erreur lors de l\'enregistrement',
                    'message' => $e->getMessage(),
                ],
                Response::HTTP_INTERNAL_SERVER_ERROR
            );
        }

       
        return $this->json(
            [
                'message' => 'Ingrédient ajouté avec succès',
                'ingredient_icon' => $ingredient->getIcon(),
                'ingredient_name' => $ingredient->getName(),
            ],
            Response::HTTP_CREATED
        );
    }

    #[Route('/api/inventory/update/{id}', name: 'inventory_update', methods: ['PUT', 'PATCH'])]
    public function update(
        int $id,
        Request $request,
        EntityManagerInterface $em,
        UserInventoryRepository $inventoryRepository,
        IngredientRepository $ingredientRepository,
        ValidatorInterface $validator
    ): JsonResponse {
        $user = $this->getUser();
        if (!$user) {
            return $this->json(['error' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);
        }

        // Récupérer l'inventaire
        $inventory = $inventoryRepository->find($id);
        if (!$inventory) {
            return $this->json(
                ['error' => 'Inventaire introuvable'],
                Response::HTTP_NOT_FOUND
            );
        }

        // Vérifier que l'inventaire appartient à l'utilisateur
        if ($inventory->getUser() !== $user) {
            return $this->json(
                ['error' => 'Accès non autorisé'],
                Response::HTTP_FORBIDDEN
            );
        }

        $data = json_decode($request->getContent(), true);
        if (!is_array($data)) {
            return $this->json(['error' => 'Corps de requête invalide'], Response::HTTP_BAD_REQUEST);
        }

        // Mise à jour de l'ingrédient si fourni
        if (isset($data['ingredient_id'])) {
            $ingredient = $ingredientRepository->find($data['ingredient_id']);
            if (!$ingredient) {
                return $this->json(
                    ['error' => 'Ingrédient introuvable'],
                    Response::HTTP_NOT_FOUND
                );
            }
            $inventory->setIngredient($ingredient);
        }

        // Mise à jour de la quantité
        if (isset($data['quantity'])) {
            $inventory->setQuantity((float) $data['quantity']);
        }

        // Mise à jour de l'unité
        if (isset($data['unit'])) {
            $inventory->setUnit((string) $data['unit']);
        }

        // Mise à jour de la date d'expiration
        if (isset($data['exp_date'])) {
            if (empty($data['exp_date']) || $data['exp_date'] === null) {
                $inventory->setExpDate(null);
            } else {
                try {
                    $expDate = new \DateTime($data['exp_date']);
                    $inventory->setExpDate($expDate);
                } catch (\Exception $e) {
                    return $this->json(
                        ['error' => 'Format de date invalide pour exp_date (attendu: YYYY-MM-DD)'],
                        Response::HTTP_BAD_REQUEST
                    );
                }
            }
        }

        // Validation
        $errors = $validator->validate($inventory);
        if (count($errors) > 0) {
            $errorsArray = [];
            foreach ($errors as $error) {
                $errorsArray[$error->getPropertyPath()][] = $error->getMessage();
            }

            return $this->json(
                [
                    'error' => 'Données invalides',
                    'details' => $errorsArray,
                ],
                Response::HTTP_BAD_REQUEST
            );
        }

        try {
            $em->flush();
        } catch (\Exception $e) {
            return $this->json(
                [
                    'error' => 'Erreur lors de la mise à jour',
                    'message' => $e->getMessage(),
                ],
                Response::HTTP_INTERNAL_SERVER_ERROR
            );
        }

        return $this->json(
            [
                'message' => 'Ingrédient modifié avec succès',
                'ingredient_icon' => $inventory->getIngredient()?->getIcon(),
                'ingredient_name' => $inventory->getIngredient()?->getName(),
            ],
            Response::HTTP_OK
        );
    }

    #[Route('/api/inventory/delete/{id}', name: 'inventory_delete', methods: ['DELETE'])]
    public function delete(
        int $id,
        EntityManagerInterface $em,
        UserInventoryRepository $inventoryRepository
    ): JsonResponse {
        $user = $this->getUser();
        if (!$user) {
            return $this->json(['error' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);
        }

        // Récupérer l'inventaire
        $inventory = $inventoryRepository->find($id);
        if (!$inventory) {
            return $this->json(
                ['error' => 'Inventaire introuvable'],
                Response::HTTP_NOT_FOUND
            );
        }

        // Vérifier que l'inventaire appartient à l'utilisateur
        if ($inventory->getUser() !== $user) {
            return $this->json(
                ['error' => 'Accès non autorisé'],
                Response::HTTP_FORBIDDEN
            );
        }

        try {
            $ingredientName = $inventory->getIngredient()?->getName();
            $em->remove($inventory);
            $em->flush();

            return $this->json(
                [
                    'message' => 'Ingrédient supprimé avec succès',
                    'ingredient_name' => $ingredientName,
                ],
                Response::HTTP_OK
            );
        } catch (\Exception $e) {
            return $this->json(
                [
                    'error' => 'Erreur lors de la suppression',
                    'message' => $e->getMessage(),
                ],
                Response::HTTP_INTERNAL_SERVER_ERROR
            );
        }
    }
}
   