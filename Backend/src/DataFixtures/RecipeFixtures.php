<?php

namespace App\DataFixtures;

use App\Entity\Recipe;
use App\Entity\Ingredient;
use App\Entity\RecipeIngredient;
use Doctrine\Common\DataFixtures\DependentFixtureInterface;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;

/**
 * Charge un seed de recettes depuis fixtures/recipes.json.
 *
 * La relation entre Recipe et Ingredient passe par RecipeIngredient (quantity + unit).
 */
class RecipeFixtures extends Fixture implements DependentFixtureInterface
{
    private function normalizeIngredientKey(string $name): string
    {
        $name = trim($name);
        // Normaliser apostrophes typographiques
        $name = str_replace(["\u{2019}", "\u{2018}"], "'", $name);

        $lower = mb_strtolower($name);

        // Supprimer accents/diacritiques pour une clé stable
        if (class_exists(\Normalizer::class)) {
            $lower = \Normalizer::normalize($lower, \Normalizer::FORM_D);
            $lower = preg_replace('/\p{Mn}+/u', '', $lower) ?? $lower;
        } else {
            $translit = @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $lower);
            if ($translit !== false) {
                $lower = $translit;
            }
        }

        // Garder lettres/chiffres + espaces uniquement
        $lower = preg_replace('/[^a-z0-9]+/u', ' ', $lower) ?? $lower;
        $lower = preg_replace('/\s+/u', ' ', $lower) ?? $lower;
        $lower = trim($lower);

        // Heuristique pluriel simple: singulariser chaque mot en -s (sauf mots vides / indénombrables)
        $stopWords = ['de', 'd', 'du', 'des', 'la', 'le', 'les', 'un', 'une', 'au', 'aux', 'et'];
        $uncountables = ['riz', 'pois', 'mais', 'couscous', 'ananas', 'houmous'];

        $parts = $lower === '' ? [] : explode(' ', $lower);
        foreach ($parts as $idx => $part) {
            if ($part === '' || in_array($part, $stopWords, true) || in_array($part, $uncountables, true)) {
                continue;
            }

            if (strlen($part) > 3 && str_ends_with($part, 's')) {
                $parts[$idx] = rtrim($part, 's');
            }
        }

        $lower = trim(implode(' ', $parts));

        return $lower;
    }

    private function inferIngredientUnit(?string $unitFromJson): string
    {
        $u = trim((string) $unitFromJson);
        if ($u === '') {
            return 'unité';
        }

        // Unités “globales” raisonnables pour l'inventaire
        $normalized = mb_strtolower($u);
        return match ($normalized) {
            'g', 'kg', 'ml', 'l' => $normalized,
            default => 'unité',
        };
    }

    public function load(ObjectManager $manager): void
    {
        $path = dirname(__DIR__, 2) . '/fixtures/recipes.json';
        if (!file_exists($path)) {
            throw new \RuntimeException('Fichier introuvable: ' . $path);
        }

        $raw = file_get_contents($path);
        $data = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);

        // Cache ingrédients pour éviter les doublons (en tenant compte d'une normalisation)
        $ingredientsByName = [];

        foreach ($manager->getRepository(Ingredient::class)->findAll() as $existing) {
            $key = $this->normalizeIngredientKey((string) $existing->getName());
            if ($key !== '' && !isset($ingredientsByName[$key])) {
                $ingredientsByName[$key] = $existing;
            }
        }

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

            // Ajouter les ingrédients à la recette (via RecipeIngredient)
            if (isset($r['ingredients']) && is_array($r['ingredients'])) {
                foreach ($r['ingredients'] as $ing) {
                    $name = isset($ing['name']) ? trim($ing['name']) : '';
                    if (empty($name)) {
                        continue;
                    }

                    $nameKey = $this->normalizeIngredientKey($name);

                    // Récupérer ou créer l'ingrédient
                    if (!isset($ingredientsByName[$nameKey])) {
                        $ingredient = new Ingredient();
                        $ingredient->setName($name);
                        $ingredient->setUnit($this->inferIngredientUnit($ing['unit'] ?? null));

                        if (isset($ing['category'])) {
                            $ingredient->setCategory($ing['category']);
                        }
                        if (isset($ing['icon'])) {
                            $ingredient->setIcon($ing['icon']);
                        }

                        $manager->persist($ingredient);
                        $ingredientsByName[$nameKey] = $ingredient;
                    } else {
                        $ingredient = $ingredientsByName[$nameKey];
                    }

                    $recipeIngredient = new RecipeIngredient();
                    $recipeIngredient->setRecipe($recipe);
                    $recipeIngredient->setIngredient($ingredient);

                    if (isset($ing['quantity']) && is_numeric($ing['quantity'])) {
                        $recipeIngredient->setQuantity((float) $ing['quantity']);
                    }

                    $unit = isset($ing['unit']) ? trim((string) $ing['unit']) : '';
                    $recipeIngredient->setUnit($unit === '' ? null : $unit);

                    $recipe->addRecipeIngredient($recipeIngredient);
                    $ingredient->addRecipeIngredient($recipeIngredient);
                }
            }
        }

        $manager->flush();
    }

    public function getDependencies(): array
    {
        return [IngredientFixtures::class];
    }
}
