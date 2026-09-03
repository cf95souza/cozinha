import { prisma } from '../lib/prisma';

interface NutritionalSummary {
  calories: number;
  proteins: number;
  carbohydrates: number;
  fats: number;
  sodium: number;
}

export class NutritionService {
  /**
   * Calcula o valor nutricional total e por porção de uma Ficha Técnica (Receita).
   * Valores base de um produto são sempre armazenados relativos a 100g (ou 100ml) no banco.
   * A quantidade (quantity) do RecipeItem geralmente é em KG ou Litros, ou seja, 
   * se o item usa 0.5 (kg) e o base é por 100g, o multiplicador é (0.5 * 1000) / 100 = 5.
   */
  async calculateRecipeNutrition(recipeId: string): Promise<{ total: NutritionalSummary, perPortion: NutritionalSummary, portions: number }> {
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      include: {
        items: {
          include: { ingredient: true }
        }
      }
    });

    if (!recipe) {
      throw new Error('Receita não encontrada');
    }
    
    return this.calculateNutritionFromObject(recipe);
  }

  async calculateNutritionFromObject(recipe: any): Promise<{ total: NutritionalSummary, perPortion: NutritionalSummary, portions: number }> {
    const total: NutritionalSummary = {
      calories: 0,
      proteins: 0,
      carbohydrates: 0,
      fats: 0,
      sodium: 0
    };

    for (const item of recipe.items) {
      const p = item.ingredient;
      
      // Assumindo que quantity está em KG/L e os valores em Product são relativos a 100g/ml
      // Multiplicador = (quantidade em KG * 1000) / 100 = quantidade * 10
      // Se a unidade for 'UN' (Unidade), assumimos que o valor do produto é por unidade.
      
      let multiplier = 0;
      if (p.unit === 'KG' || p.unit === 'L') {
        multiplier = item.quantity * 10; 
      } else if (p.unit === 'G' || p.unit === 'ML') {
        multiplier = item.quantity / 100;
      } else {
        // UN, CX, etc
        multiplier = item.quantity;
      }

      total.calories += (p.calories || 0) * multiplier;
      total.proteins += (p.proteins || 0) * multiplier;
      total.carbohydrates += (p.carbohydrates || 0) * multiplier;
      total.fats += (p.fats || 0) * multiplier;
      total.sodium += (p.sodium || 0) * multiplier;
    }

    // Calcular porção (Por padrão consideramos 1 porção sendo o rendimento total,
    // mas se o rendimento for em KG, a porção padrão de um prato costuma ser ~400g)
    // Para simplificar no MVP, retornamos a tabela dividida pelo ExpectedYield se a unidade final for 'UN'.
    // Caso contrário, retornaremos o total para 100g do produto final.
    
    // Vamos buscar a unidade do produto final
    let finalProduct = recipe.product;
    if (!finalProduct) {
      finalProduct = await prisma.product.findUnique({ where: { id: recipe.productId } });
    }
    
    let portions = 1;
    let perPortion = { ...total };

    if (finalProduct) {
      if (finalProduct.unit === 'UN') {
         portions = recipe.expectedYield; 
         if (portions > 0) {
           perPortion.calories = total.calories / portions;
           perPortion.proteins = total.proteins / portions;
           perPortion.carbohydrates = total.carbohydrates / portions;
           perPortion.fats = total.fats / portions;
           perPortion.sodium = total.sodium / portions;
         }
      } else if (finalProduct.unit === 'KG' || finalProduct.unit === 'L') {
         // O total é para 'expectedYield' KG.
         // A porção padrão ANVISA será 100g do produto final.
         // O peso total em gramas é expectedYield * 1000.
         const totalGrams = recipe.expectedYield * 1000;
         if (totalGrams > 0) {
            const factor = 100 / totalGrams;
            portions = totalGrams / 100; // Quantas porções de 100g existem
            perPortion.calories = total.calories * factor;
            perPortion.proteins = total.proteins * factor;
            perPortion.carbohydrates = total.carbohydrates * factor;
            perPortion.fats = total.fats * factor;
            perPortion.sodium = total.sodium * factor;
         }
      }
    }

    // Arredondar para 2 casas decimais
    const round2 = (val: number) => Math.round(val * 100) / 100;

    return {
      total: {
        calories: round2(total.calories),
        proteins: round2(total.proteins),
        carbohydrates: round2(total.carbohydrates),
        fats: round2(total.fats),
        sodium: round2(total.sodium),
      },
      perPortion: {
        calories: round2(perPortion.calories),
        proteins: round2(perPortion.proteins),
        carbohydrates: round2(perPortion.carbohydrates),
        fats: round2(perPortion.fats),
        sodium: round2(perPortion.sodium),
      },
      portions: round2(portions)
    };
  }
}
