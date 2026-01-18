<?php

namespace App\DataFixtures;

use App\Entity\Recipe;
use App\Entity\Ingredient;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;

/**
 * Charge un seed de recettes depuis fixtures/recipes.json.
 *
 * La relation entre Recipe et Ingredient est une ManyToMany directe.
 */
class RecipeFixtures extends Fixture
{
    public function load(ObjectManager $manager): void
    {
        $path = dirname(__DIR__, 2) . '/fixtures/recipes.json';
        if (!file_exists($path)) {
            throw new \RuntimeException('Fichier introuvable: ' . $path);
        }

        $raw = file_get_contents($path);
        $data = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);

        // Cache ingrédients pour éviter les doublons
        $ingredientsByName = [];

        foreach ($data as $r) {
            $recipe = new Recipe();

            // Champs recette
            if (isset($r['title'])) {
                $recipe->setTitle($r['title']);
            }
            
            if (isset($r['description']) || isset($r['instructions'])) {
                $recipe->setDescription($r['description'] ?? $r['instructions'] ?? '');
            }
            
            if (isset($r['prep_time_min']) || isset($r['prepTime'])) {
                $recipe->setPrepTime((int)($r['prep_time_min'] ?? $r['prepTime'] ?? 0));
            }
            
            if (isset($r['image_url']) || isset($r['imageUrl'])) {
                $recipe->setImageUrl($r['image_url'] ?? $r['imageUrl'] ?? null);
            }
            
            $recipe->setCreatedAt(new \DateTimeImmutable());

            $manager->persist($recipe);

            // Ajouter les ingrédients à la recette (relation ManyToMany)
            if (isset($r['ingredients']) && is_array($r['ingredients'])) {
                foreach ($r['ingredients'] as $ing) {
                    $name = isset($ing['name']) ? trim($ing['name']) : '';
                    if (empty($name)) {
                        continue;
                    }

                    // Normaliser le nom pour éviter les doublons
                    $nameLower = mb_strtolower($name);

                    // Récupérer ou créer l'ingrédient
                    if (!isset($ingredientsByName[$nameLower])) {
                        // Chercher d'abord dans la base de données
                        $existingIngredient = $manager->getRepository(Ingredient::class)
                            ->findOneBy(['name' => $name]);
                        
                        if ($existingIngredient) {
                            $ingredient = $existingIngredient;
                        } else {
                            $ingredient = new Ingredient();
                            $ingredient->setName($name);
                            // Si tu as d'autres champs dans le JSON, adapte ici
                            if (isset($ing['unit'])) {
                                $ingredient->setUnit($ing['unit']);
                            }
                            if (isset($ing['category'])) {
                                $ingredient->setCategory($ing['category']);
                            }
                            if (isset($ing['icon'])) {
                                $ingredient->setIcon($ing['icon']);
                            }
                            $manager->persist($ingredient);
                        }
                        $ingredientsByName[$nameLower] = $ingredient;
                    } else {
                        $ingredient = $ingredientsByName[$nameLower];
                    }

                    // Ajouter l'ingrédient à la recette (relation ManyToMany)
                    $recipe->addIngredient($ingredient);
                }
            }
        }

        $manager->flush();
    }
}
