<?php

namespace App\DataFixtures;

use App\Entity\Ingredient;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;

class IngredientFixtures extends Fixture
{
    private function normalizeIngredientKey(string $name): string
    {
        $name = trim($name);
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

    public function load(ObjectManager $manager): void
    {
        $existingByName = [];
        foreach ($manager->getRepository(Ingredient::class)->findAll() as $existing) {
            $key = $this->normalizeIngredientKey((string) $existing->getName());
            if ($key !== '' && !isset($existingByName[$key])) {
                $existingByName[$key] = true;
            }
        }

        $path = dirname(__DIR__, 2) . '/fixtures/ingredients.json';
        if (!file_exists($path)) {
            throw new \RuntimeException('Fichier introuvable: ' . $path);
        }

        $raw = file_get_contents($path);
        $ingredients = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
        if (!is_array($ingredients)) {
            throw new \RuntimeException('Format invalide: ' . $path);
        }

        foreach ($ingredients as $data) {
            if (!is_array($data)) {
                continue;
            }

            $key = $this->normalizeIngredientKey((string) ($data['name'] ?? ''));
            if ($key === '' || isset($existingByName[$key])) {
                continue;
            }

            $ingredient = new Ingredient();
            $ingredient->setName($data['name']);
            $ingredient->setCategory($data['category']);
            $ingredient->setUnit($data['unit']);
            $ingredient->setIcon($data['icon']);
            
            $manager->persist($ingredient);
            $existingByName[$key] = true;
        }

        $manager->flush();
    }
}