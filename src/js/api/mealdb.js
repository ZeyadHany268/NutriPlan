const MEALDB_BASE_URL = "https://www.themealdb.com/api/json/v1/1";
const NUTRITION_API_URL = "https://nutriplan-api.vercel.app/api/nutrition/analyze";
const NUTRITION_API_KEY = "xRGnhxcXrKuX8hJpeeQE5Rac9b7dyQDpaMs5fWFL";
const OPEN_FOOD_FACTS_URL = "https://world.openfoodfacts.org";

// small helper so we don't repeat fetch + error check everywhere
async function getJson(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  return response.json();
}

export class MealApi {
  async getCategories() {
    const data = await getJson(`${MEALDB_BASE_URL}/categories.php`);
    return data.categories || [];
  }

  async getAreas() {
    const data = await getJson(`${MEALDB_BASE_URL}/list.php?a=list`);
    return data.meals || [];
  }

  async searchMeals(query) {
    const data = await getJson(`${MEALDB_BASE_URL}/search.php?s=${encodeURIComponent(query)}`);
    return data.meals || [];
  }

  async filterByCategory(category) {
    const data = await getJson(`${MEALDB_BASE_URL}/filter.php?c=${encodeURIComponent(category)}`);
    return data.meals || [];
  }

  async filterByArea(area) {
    const data = await getJson(`${MEALDB_BASE_URL}/filter.php?a=${encodeURIComponent(area)}`);
    return data.meals || [];
  }

  async getMealById(id) {
    const data = await getJson(`${MEALDB_BASE_URL}/lookup.php?i=${encodeURIComponent(id)}`);
    return data.meals ? data.meals[0] : null;
  }

  // MealDB stores ingredients as strIngredient1..20 / strMeasure1..20, so we loop through them
  extractIngredients(meal) {
    const ingredients = [];

    for (let i = 1; i <= 20; i++) {
      const ingredient = meal[`strIngredient${i}`];
      const measure = meal[`strMeasure${i}`];

      if (ingredient && ingredient.trim()) {
        ingredients.push({
          ingredient: ingredient.trim(),
          measure: measure ? measure.trim() : "",
        });
      }
    }

    return ingredients;
  }

  // turns the raw instructions text block into a clean array of steps
  parseInstructions(instructions) {
    if (!instructions) {
      return [];
    }

    const lines = instructions.split(/(?:\r\n|\r|\n)+/);
    const steps = [];

    for (let line of lines) {
      line = line.trim();
      if (line.length > 5) {
        // remove leading numbering like "1." or "2)" if it's already there
        steps.push(line.replace(/^\d+[.)]\s*/, ""));
      }
    }

    return steps;
  }
}

export class NutritionApi {
  constructor() {
    this.cache = new Map();
  }

  async analyzeRecipe(recipeName, ingredients) {
    const cacheKey = `${recipeName}_${ingredients.join("|")}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const response = await getJson(NUTRITION_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": NUTRITION_API_KEY,
      },
      body: JSON.stringify({ recipeName, ingredients }),
    });

    if (!response.success || !response.data) {
      throw new Error("Nutrition data was not returned");
    }

    const data = response.data;
    const nutrition = {
      servings: Number(data.servings) || 0,
      totalWeight: Number(data.totalWeight) || 0,
      totals: this.normalizeValues(data.totals),
      perServing: this.normalizeValues(data.perServing),
      ingredients: data.ingredients || [],
    };

    this.cache.set(cacheKey, nutrition);
    return nutrition;
  }

  // makes sure every nutrition object always has the same fields, as numbers
  normalizeValues(values = {}) {
    return {
      calories: Number(values.calories) || 0,
      protein: Number(values.protein) || 0,
      carbs: Number(values.carbs) || 0,
      fat: Number(values.fat) || 0,
      fiber: Number(values.fiber) || 0,
      sugar: Number(values.sugar) || 0,
      saturatedFat: Number(values.saturatedFat) || 0,
      cholesterol: Number(values.cholesterol) || 0,
      sodium: Number(values.sodium) || 0,
    };
  }
}

export class ProductApi {
  async searchProducts({ searchTerms = "", category = "", grade = "", pageSize = 24 } = {}) {
    const params = new URLSearchParams({
      page: "1",
      page_size: String(pageSize),
      json: "1",
    });

    if (searchTerms) params.set("search_terms", searchTerms);
    if (category) params.set("categories_tags_en", category);
    if (grade) params.set("nutrition_grades_tags", grade);

    const data = await getJson(`${OPEN_FOOD_FACTS_URL}/cgi/search.pl?${params.toString()}`);

    return {
      count: data.count || 0,
      page: data.page || 1,
      pageSize: data.page_size || pageSize,
      products: (data.products || []).map((product) => this.normalizeProduct(product)),
    };
  }

  async getProductByBarcode(barcode) {
    const data = await getJson(`${OPEN_FOOD_FACTS_URL}/api/v0/product/${encodeURIComponent(barcode)}.json`);
    if (data.status === 0 || !data.product) {
      return null;
    }
    return this.normalizeProduct(data.product);
  }

  async getProductsByCategory(category) {
    const url = `${OPEN_FOOD_FACTS_URL}/category/${encodeURIComponent(category)}.json?page=1&page_size=24`;
    const data = await getJson(url);

    return {
      count: data.count || 0,
      page: data.page || 1,
      products: (data.products || []).map((product) => this.normalizeProduct(product)),
    };
  }

  // static list of categories shown in the UI, matches Open Food Facts tags
  getCategories() {
    return [
      { id: "breakfast_cereals", name: "Breakfast Cereals", icon: "fa-wheat-awn" },
      { id: "beverages", name: "Beverages", icon: "fa-bottle-water" },
      { id: "snacks", name: "Snacks", icon: "fa-cookie" },
      { id: "dairy", name: "Dairy Products", icon: "fa-cheese" },
      { id: "fruits", name: "Fruits", icon: "fa-apple-whole" },
      { id: "vegetables", name: "Vegetables", icon: "fa-carrot" },
      { id: "breads", name: "Breads", icon: "fa-bread-slice" },
      { id: "meats", name: "Meats", icon: "fa-drumstick-bite" },
      { id: "frozen_foods", name: "Frozen Foods", icon: "fa-snowflake" },
      { id: "sauces", name: "Sauces & Condiments", icon: "fa-jar" },
    ];
  }

  // Open Food Facts returns messy/inconsistent fields, this cleans them into one shape
  normalizeProduct(product = {}) {
    const nutriments = product.nutriments || {};

    return {
      barcode: product.code || product._id || "",
      name: product.product_name || product.product_name_en || "Unknown Product",
      brand: product.brands || "",
      categories: product.categories || "",
      image: product.image_front_url || product.image_url || null,
      thumbnailImage: product.image_front_small_url || product.image_small_url || null,
      nutritionGrade: product.nutrition_grades || product.nutrition_grade_fr || null,
      novaGroup: product.nova_group || null,
      ecoscore: product.ecoscore_grade || null,
      ingredients: product.ingredients_text || product.ingredients_text_en || "",
      allergens: product.allergens || "",
      quantity: product.quantity || "",
      servingSize: product.serving_size || "",
      nutrition: {
        calories: Number(nutriments["energy-kcal_100g"] || nutriments.energy_100g || 0),
        fat: Number(nutriments.fat_100g || 0),
        saturatedFat: Number(nutriments["saturated-fat_100g"] || 0),
        carbs: Number(nutriments.carbohydrates_100g || 0),
        sugar: Number(nutriments.sugars_100g || 0),
        fiber: Number(nutriments.fiber_100g || 0),
        protein: Number(nutriments.proteins_100g || 0),
        salt: Number(nutriments.salt_100g || 0),
        sodium: Number(nutriments.sodium_100g || 0),
      },
    };
  }

  getNutriScoreInfo(grade) {
    const scores = {
      a: { label: "Excellent", color: "#038141" },
      b: { label: "Good", color: "#85bb2f" },
      c: { label: "Average", color: "#fecb02" },
      d: { label: "Poor", color: "#ee8100" },
      e: { label: "Bad", color: "#e63e11" },
    };
    return scores[String(grade || "").toLowerCase()] || { label: "Unknown", color: "#999" };
  }
}

export const mealApi = new MealApi();
export const nutritionApi = new NutritionApi();
export const productApi = new ProductApi();