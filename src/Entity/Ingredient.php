<?php

namespace App\Entity;

use App\Repository\IngredientRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: IngredientRepository::class)]
class Ingredient
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['ingredient:read', 'inventory:read', 'recipe:read'])]
    private ?int $id = null;

    #[ORM\Column(length: 150)]
    #[Groups(['ingredient:read', 'inventory:read', 'recipe:read'])]
    private ?string $name = null;

    #[ORM\Column(length: 50)]
    #[Groups(['ingredient:read', 'inventory:read', 'recipe:read'])]
    private ?string $unit = null;

    #[ORM\Column(length: 100, nullable: true)]
    #[Groups(['ingredient:read', 'inventory:read', 'recipe:read'])]
    private ?string $category = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['ingredient:read', 'inventory:read', 'recipe:read'])]
    private ?string $icon = null;

    /**
     * @var Collection<int, UserInventory>
     */
    #[ORM\OneToMany(targetEntity: UserInventory::class, mappedBy: 'ingredient')]
    private Collection $userInventories;


    /**
     * @var Collection<int, RecipeIngredient>
     */
    #[ORM\OneToMany(targetEntity: RecipeIngredient::class, mappedBy: 'ingredient', orphanRemoval: true)]
    private Collection $recipeIngredients;

    public function __construct()
    {
        $this->userInventories = new ArrayCollection();
        $this->recipeIngredients = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getName(): ?string
    {
        return $this->name;
    }

    public function setName(string $name): static
    {
        $this->name = $name;

        return $this;
    }

    public function getUnit(): ?string
    {
        return $this->unit;
    }

    public function setUnit(string $unit): static
    {
        $this->unit = $unit;

        return $this;
    }

    public function getCategory(): ?string
    {
        return $this->category;
    }

    public function setCategory(?string $category): static
    {
        $this->category = $category;

        return $this;
    }

    public function getIcon(): ?string
    {
        return $this->icon;
    }

    public function setIcon(?string $icon): static
    {
        $this->icon = $icon;

        return $this;
    }

    /**
     * @return Collection<int, UserInventory>
     */
    public function getUserInventories(): Collection
    {
        return $this->userInventories;
    }

    public function addUserInventory(UserInventory $userInventory): static
    {
        if (!$this->userInventories->contains($userInventory)) {
            $this->userInventories->add($userInventory);
            $userInventory->setIngredient($this);
        }

        return $this;
    }

    public function removeUserInventory(UserInventory $userInventory): static
    {
        if ($this->userInventories->removeElement($userInventory)) {
            // set the owning side to null (unless already changed)
            if ($userInventory->getIngredient() === $this) {
                $userInventory->setIngredient(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, RecipeIngredient>
     */
    public function getRecipeIngredients(): Collection
    {
        return $this->recipeIngredients;
    }

    public function addRecipeIngredient(RecipeIngredient $recipeIngredient): static
    {
        if (!$this->recipeIngredients->contains($recipeIngredient)) {
            $this->recipeIngredients->add($recipeIngredient);
            $recipeIngredient->setIngredient($this);
        }

        return $this;
    }

    public function removeRecipeIngredient(RecipeIngredient $recipeIngredient): static
    {
        if ($this->recipeIngredients->removeElement($recipeIngredient)) {
            // set the owning side to null (unless already changed)
            if ($recipeIngredient->getIngredient() === $this) {
                $recipeIngredient->setIngredient(null);
            }
        }

        return $this;
    }
}
