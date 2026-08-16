import { mealApi, nutritionApi, productApi } from "./api/mealdb.js";
import { appState } from "./state/appState.js";
import {
  createCategoryCard,
  createAreaChip,
  createMealCard,
  createProductCard,
  createNutritionFacts,
  createProductDetailContent,
  createLoggedItem,
  createLoadingSpinner,
  createEmptyState,
  formatDate,
  formatNumber,
  escapeHtml,
} from "./ui/components.js";

const $ = (selector) => document.querySelector(selector);

class FoodLogManager {
  constructor(state, app) {
    this.state = state;
    this.app = app;
  }

  logMeal(meal, servings, nutrition) {
    const perServing = nutrition.perServing;

    const finalNutrition = {
      calories: Math.round(perServing.calories * servings),
      protein: Math.round(perServing.protein * servings),
      carbs: Math.round(perServing.carbs * servings),
      fat: Math.round(perServing.fat * servings),
      fiber: Math.round(perServing.fiber * servings),
      sugar: Math.round(perServing.sugar * servings),
      saturatedFat: Math.round(perServing.saturatedFat * servings),
      cholesterol: Math.round(perServing.cholesterol * servings),
      sodium: Math.round(perServing.sodium * servings),
    };

    this.state.addLogItem({
      type: "meal",
      name: meal.strMeal,
      mealId: meal.idMeal,
      category: meal.strCategory,
      thumbnail: meal.strMealThumb,
      servings,
      nutrition: finalNutrition,
      loggedAt: new Date().toISOString(),
    });

    this.app.showSuccessAlert(meal.strMeal, servings, finalNutrition.calories);
  }

  logProduct(product) {
    const nutrition = product.nutrition || {};

    this.state.addLogItem({
      type: "product",
      name: product.name,
      brand: product.brand,
      barcode: product.barcode,
      thumbnail: product.image,
      serving: "100g",
      nutrition: {
        calories: Math.round(nutrition.calories || 0),
        protein: Math.round(nutrition.protein || 0),
        carbs: Math.round(nutrition.carbs || 0),
        fat: Math.round(nutrition.fat || 0),
        fiber: Math.round(nutrition.fiber || 0),
        sugar: Math.round(nutrition.sugar || 0),
      },
      loggedAt: new Date().toISOString(),
    });

    this.app.showToast(`${product.name} logged to your daily intake.`, "success");
  }

  getGoals() {
    return { calories: 2000, protein: 50, carbs: 250, fat: 65 };
  }

  // builds the last 7 days of totals for the weekly overview chart
  getWeeklyData() {
    const goals = this.getGoals();
    const today = new Date();
    const days = [];

    for (let offset = 6; offset >= 0; offset--) {
      const date = new Date(today);
      date.setDate(today.getDate() - offset);

      const key = this.dateKey(date);
      const log = this.state.getState().dailyLog[key] || {
        meals: [],
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0,
      };

      const calories = Math.round(log.totalCalories || 0);
      const protein = Math.round(log.totalProtein || 0);
      const carbs = Math.round(log.totalCarbs || 0);
      const fat = Math.round(log.totalFat || 0);

      const isOverGoal = calories > goals.calories;
      const isOnGoal = calories >= goals.calories * 0.8 && !isOverGoal;

      days.push({
        key,
        date,
        dayName: date.toLocaleDateString("en-US", { weekday: "short" }),
        calories,
        protein,
        carbs,
        fat,
        itemCount: (log.meals || []).length,
        isToday: offset === 0,
        isOverGoal,
        isOnGoal,
      });
    }

    return days;
  }

  dateKey(date) {
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${date.getFullYear()}-${month}-${day}`;
  }

  render() {
    const section = $("#foodlog-section");
    if (!section) return;

    const log = this.state.getTodayLog();
    const goals = this.getGoals();

    const percentages = {
      calories: Math.min(100, Math.round((log.totalCalories / goals.calories) * 100)),
      protein: Math.min(100, Math.round((log.totalProtein / goals.protein) * 100)),
      carbs: Math.min(100, Math.round((log.totalCarbs / goals.carbs) * 100)),
      fat: Math.min(100, Math.round((log.totalFat / goals.fat) * 100)),
    };

    const today = new Date();
    const meals = log.meals || [];
    const weeklyData = this.getWeeklyData();
    const average = Math.round(weeklyData.reduce((sum, day) => sum + day.calories, 0) / 7);
    const goalDays = weeklyData.filter((day) => day.isOnGoal).length;
    const totalWeeklyItems = weeklyData.reduce((total, day) => total + day.itemCount, 0);

    const loggedItemsHtml = meals.length
      ? meals.map((item, index) => createLoggedItem(item, index)).join("")
      : createEmptyState("No food logged today", "Start tracking your nutrition by logging meals or scanning products", "fa-utensils");

    const clearButtonHtml = meals.length
      ? `<button id="clear-foodlog" class="text-red-500 hover:text-red-600 text-sm font-medium"><i class="fa-solid fa-trash mr-1"></i>Clear All</button>`
      : "";

    const weekDaysHtml = weeklyData
      .map((day) => this.createWeekDayCard(day))
      .join("");

    section.innerHTML = `
      <div class="max-w-7xl mx-auto">
        <div class="foodlog-hero bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 mb-6 text-white">
          <div class="flex items-center justify-between gap-4">
            <div>
              <h2 class="text-2xl font-bold mb-2"><i class="fa-solid fa-clipboard-list mr-2"></i>Daily Food Log</h2>
              <p class="opacity-90">Track and monitor your daily nutrition intake</p>
            </div>
            <div class="text-right">
              <p class="text-sm opacity-80">Today</p>
              <p class="text-xl font-bold">${formatDate(today)}</p>
            </div>
          </div>
        </div>

        <div id="foodlog-today-section" class="bg-white rounded-2xl p-6 mb-6 border border-gray-200 shadow-sm">
          <h3 class="text-lg font-bold text-gray-900 mb-4"><i class="fa-solid fa-fire text-orange-500 mr-2"></i>Today's Nutrition</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            ${this.createProgressCard("Calories", log.totalCalories, goals.calories, "kcal", percentages.calories, "emerald", log.totalCalories > goals.calories)}
            ${this.createProgressCard("Protein", log.totalProtein, goals.protein, "g", percentages.protein, "red", log.totalProtein > goals.protein)}
            ${this.createProgressCard("Carbs", log.totalCarbs, goals.carbs, "g", percentages.carbs, "amber", log.totalCarbs > goals.carbs)}
            ${this.createProgressCard("Fat", log.totalFat, goals.fat, "g", percentages.fat, "red", log.totalFat > goals.fat)}
          </div>
          <div class="border-t border-gray-200 pt-4">
            <div class="flex items-center justify-between mb-1">
              <h4 class="text-sm font-semibold text-gray-700">Logged Items (${meals.length})</h4>
              ${clearButtonHtml}
            </div>
            <div id="logged-items-list">${loggedItemsHtml}</div>
          </div>
        </div>

        <div class="bg-white rounded-2xl p-6 mb-6 border border-gray-200 shadow-sm">
          <h3 class="text-lg font-bold text-gray-900 mb-4"><i class="fa-solid fa-calendar-week text-indigo-500 mr-2"></i>Weekly Overview</h3>
          <div id="weekly-chart" class="grid grid-cols-7 gap-2">${weekDaysHtml}</div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div class="foodlog-summary-card bg-white rounded-xl p-4 border border-gray-200 flex items-center gap-3 shadow-sm">
            <div class="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center"><i class="fa-solid fa-chart-line text-emerald-600"></i></div>
            <div><p class="text-sm text-gray-500">Weekly Average</p><p class="text-lg font-bold text-gray-900">${formatNumber(average)} kcal</p></div>
          </div>
          <div class="foodlog-summary-card bg-white rounded-xl p-4 border border-gray-200 flex items-center gap-3 shadow-sm">
            <div class="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center"><i class="fa-solid fa-utensils text-blue-600"></i></div>
            <div><p class="text-sm text-gray-500">Total Items This Week</p><p class="text-lg font-bold text-gray-900">${totalWeeklyItems} items</p></div>
          </div>
          <div class="foodlog-summary-card bg-white rounded-xl p-4 border border-gray-200 flex items-center gap-3 shadow-sm">
            <div class="w-11 h-11 rounded-xl bg-purple-100 flex items-center justify-center"><i class="fa-solid fa-bullseye text-purple-600"></i></div>
            <div><p class="text-sm text-gray-500">Days On Goal</p><p class="text-lg font-bold text-gray-900">${goalDays} / 7</p></div>
          </div>
        </div>
      </div>
    `;
  }

  createWeekDayCard(day) {
    const highlightClass = day.isToday ? "foodlog-week-day-today bg-indigo-100 rounded-xl" : "";
    const calorieColor = day.isOverGoal ? "text-red-600" : day.calories ? "text-emerald-600" : "text-gray-300";
    const itemsHtml = day.itemCount
      ? `<p class="text-xs text-gray-400 mt-1">${day.itemCount} item${day.itemCount === 1 ? "" : "s"}</p>`
      : "";

    return `
      <div class="foodlog-week-day text-center p-2 ${highlightClass}">
        <p class="text-xs text-gray-500 mb-1">${day.dayName}</p>
        <p class="text-sm font-medium text-gray-900">${day.date.getDate()}</p>
        <div class="mt-2 ${calorieColor}">
          <p class="text-lg font-bold">${day.calories}</p>
          <p class="text-xs">kcal</p>
        </div>
        ${itemsHtml}
      </div>
    `;
  }

  createProgressCard(name, value, goal, unit, percentage, color, isOverGoal = false) {
    const colors = {
      emerald: { background: "#f0fdf4", bar: "#10b981", text: "#059669" },
      red: { background: "#fff1f2", bar: "#ef4444", text: "#dc2626" },
      amber: { background: "#fffbeb", bar: "#f59e0b", text: "#d97706" },
      over: { background: "#fff1f2", bar: "#ef3340", text: "#dc2626" },
    };
    const palette = isOverGoal ? colors.over : colors[color] || colors.emerald;

    return `
      <div class="foodlog-metric-card rounded-xl p-4" style="background:${palette.background}">
        <div class="flex items-center justify-between mb-3">
          <span class="text-sm font-medium text-gray-700">${name}</span>
          <span class="text-xs font-medium" style="color:${palette.text}">${percentage}%</span>
        </div>
        <div class="w-full bg-white/80 rounded-full h-2 mb-3">
          <div class="h-2 rounded-full" style="width:${percentage}%;background:${palette.bar}"></div>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-sm font-bold" style="color:${palette.text}">${formatNumber(value)} ${unit}</span>
          <span class="text-xs text-gray-400">/ ${goal} ${unit}</span>
        </div>
      </div>
    `;
  }
}

class NutriPlanApp {
  constructor() {
    this.state = appState;
    this.foodLog = new FoodLogManager(this.state, this);
    this.searchTimer = null;
    this.currentPage = "meals";
    this.init();
  }

  async init() {
    this.state.initialize();
    this.setupStaticListeners();
    this.setupRouting();
    this.hideSections();

    try {
      await this.loadInitialData();

      const route = this.getRoute();
      if (route.type === "meal-detail") {
        await this.loadMealFromSlug(route.slug);
      } else {
        this.renderPage(route.type);
      }
    } catch (error) {
      console.error("NutriPlan initialization failed", error);
      this.renderPage("meals");
      this.renderMealsError("Unable to load meals right now. Please refresh and try again.");
    } finally {
      this.hideLoadingOverlay();
    }
  }

  setupStaticListeners() {
    const searchInput = $("#search-input");
    if (searchInput) {
      searchInput.addEventListener("input", (event) => {
        clearTimeout(this.searchTimer);
        this.searchTimer = setTimeout(() => this.searchMeals(event.target.value.trim()), 350);
      });

      searchInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          clearTimeout(this.searchTimer);
          this.searchMeals(event.target.value.trim());
        }
      });
    }

    $("#header-menu-btn")?.addEventListener("click", () => this.toggleSidebar());
    $("#sidebar-close-btn")?.addEventListener("click", () => this.closeSidebar());
    $("#sidebar-overlay")?.addEventListener("click", () => this.closeSidebar());
    $("#back-to-meals-btn")?.addEventListener("click", () => this.navigate("meals"));

    const viewAllButton = $("#meal-categories-section .flex.items-center.justify-between button");
    viewAllButton?.addEventListener("click", () => {
      document.getElementById("all-recipes-section")?.scrollIntoView({ behavior: "smooth" });
    });

    // one click listener for the whole page handles most buttons/cards, see handleDocumentClick
    document.addEventListener("click", (event) => this.handleDocumentClick(event));
  }

  setupRouting() {
    // set the default route first so this doesn't fire the listener below on first load
    if (!window.location.hash) {
      window.location.hash = "#/home";
    }

    // hash routes (#/products, #/meal/slug) work with any static server, no server config needed
    window.addEventListener("hashchange", async () => {
      this.closeSidebar();
      const route = this.getRoute();
      if (route.type === "meal-detail") {
        await this.loadMealFromSlug(route.slug);
      } else {
        this.renderPage(route.type);
      }
    });
  }

  getRoute() {
    const path = window.location.hash.replace(/^#\/?/, "").replace(/\/$/, "");

    if (path.startsWith("meal/")) return { type: "meal-detail", slug: path.replace("meal/", "") };
    if (path === "products") return { type: "products" };
    if (path === "foodlog") return { type: "foodlog" };
    return { type: "meals" };
  }

  navigate(page) {
    const paths = { meals: "#/home", products: "#/products", foodlog: "#/foodlog" };
    const hash = paths[page] || "#/home";

    if (window.location.hash !== hash) {
      window.location.hash = hash;
    } else {
      this.closeSidebar();
      this.renderPage(page);
    }
  }

  navigateToMeal(meal) {
    const slug = this.slugify(meal.strMeal);
    window.location.hash = `#/meal/${slug}`;
  }

  slugify(value) {
    return String(value)
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  async loadInitialData() {
    const [categories, areas, meals] = await Promise.all([
      mealApi.getCategories(),
      mealApi.getAreas(),
      mealApi.searchMeals("chicken"),
    ]);
    this.state.setState({ categories, areas, meals });
  }

  renderPage(page) {
    this.currentPage = page;
    this.hideSections();
    this.updateHeader(page);

    if (page === "products") {
      this.renderProductsPage();
    } else if (page === "foodlog") {
      this.foodLog.render();
      $("#foodlog-section").style.display = "block";
    } else if (page === "meal-detail") {
      $("#meal-details").style.display = "block";
    } else {
      $("#search-filters-section").style.display = "";
      $("#meal-categories-section").style.display = "";
      $("#all-recipes-section").style.display = "";
      this.renderMeals();
    }

    this.updateActiveNav(page);
  }

  hideSections() {
    const sectionIds = [
      "search-filters-section",
      "meal-categories-section",
      "all-recipes-section",
      "meal-details",
      "products-section",
      "foodlog-section",
    ];

    sectionIds.forEach((id) => {
      const section = document.getElementById(id);
      if (section) section.style.display = "none";
    });
  }

  updateHeader(page) {
    const titles = {
      meals: ["Meals & Recipes", "Discover delicious and nutritious recipes tailored for you"],
      products: ["Product Scanner", "Search packaged foods by name or barcode"],
      foodlog: ["Food Log", "Track your daily nutrition and food intake"],
      "meal-detail": ["Recipe Details", "View full recipe information and nutrition facts"],
    };
    const [title, subtitle] = titles[page] || titles.meals;

    const titleElement = $("#header h1");
    const subtitleElement = $("#header p");
    if (titleElement) titleElement.textContent = title;
    if (subtitleElement) subtitleElement.textContent = subtitle;
  }

  updateActiveNav(page) {
    document.querySelectorAll("#sidebar nav .nav-link").forEach((link) => {
      const text = link.textContent.toLowerCase();
      const linkPage = text.includes("product") ? "products" : text.includes("food log") ? "foodlog" : "meals";
      const isActive = linkPage === page || (page === "meal-detail" && linkPage === "meals");

      link.classList.toggle("bg-emerald-50", isActive);
      link.classList.toggle("text-emerald-700", isActive);
      link.classList.toggle("text-gray-600", !isActive);
    });
  }

  renderMeals() {
    const state = this.state.getState();

    const categoriesGrid = $("#categories-grid");
    if (categoriesGrid) {
      categoriesGrid.innerHTML = (state.categories || []).slice(0, 12).map(createCategoryCard).join("");
    }

    this.renderAreaFilters();
    this.renderRecipeGrid(state.meals || []);
  }

  renderAreaFilters() {
    const container = $("#search-filters-section .flex.items-center.gap-3");
    if (!container) return;

    const selected = this.state.getState().selectedArea || "";
    const areas = this.state.getState().areas || [];

    const chips = [createAreaChip("", selected === "")];
    areas.slice(0, 20).forEach((area) => {
      chips.push(createAreaChip(area.strArea, selected === area.strArea));
    });

    container.innerHTML = chips.join("");
  }

  renderRecipeGrid(meals) {
    const grid = $("#recipes-grid");
    const count = $("#recipes-count");
    if (!grid) return;

    const state = this.state.getState();
    grid.classList.toggle("recipe-list-mode", state.viewMode === "list");

    if (!meals.length) {
      grid.innerHTML = createEmptyState("No recipes found", "Try searching for something else.");
    } else {
      grid.innerHTML = meals.map(createMealCard).join("");
    }

    if (count) {
      count.textContent = state.searchQuery
        ? `Showing ${meals.length} recipes for "${state.searchQuery}"`
        : `Showing ${meals.length} recipes`;
    }

    $("#grid-view-btn")?.classList.toggle("bg-white", state.viewMode === "grid");
    $("#list-view-btn")?.classList.toggle("bg-white", state.viewMode === "list");
  }

  renderMealsError(message) {
    const grid = $("#recipes-grid");
    if (grid) grid.innerHTML = createEmptyState("Unable to load recipes", message, "fa-circle-exclamation");
  }

  async searchMeals(query) {
    this.state.setState({ searchQuery: query, selectedArea: "", selectedCategory: "" });

    const grid = $("#recipes-grid");
    if (grid) grid.innerHTML = createLoadingSpinner("Searching recipes...");

    try {
      const meals = await mealApi.searchMeals(query || "chicken");
      this.state.setState({ meals });
      this.renderAreaFilters();
      this.renderRecipeGrid(meals);
    } catch (error) {
      console.error("Meal search failed", error);
      this.renderMealsError("Search could not be completed. Please try again.");
    }
  }

  async filterByArea(area) {
    this.state.setState({ selectedArea: area, searchQuery: "", selectedCategory: "" });

    const grid = $("#recipes-grid");
    if (grid) grid.innerHTML = createLoadingSpinner("Loading cuisine recipes...");

    try {
      const meals = area ? await mealApi.filterByArea(area) : await mealApi.searchMeals("chicken");
      this.state.setState({ meals });
      this.renderAreaFilters();
      this.renderRecipeGrid(meals);
    } catch (error) {
      console.error("Area filter failed", error);
      this.renderMealsError("Cuisine recipes could not be loaded.");
    }
  }

  async filterByCategory(category) {
    this.state.setState({ selectedCategory: category, searchQuery: "", selectedArea: "" });

    const grid = $("#recipes-grid");
    if (grid) grid.innerHTML = createLoadingSpinner("Loading category recipes...");

    try {
      const meals = await mealApi.filterByCategory(category);
      this.state.setState({ meals });
      this.renderAreaFilters();
      this.renderRecipeGrid(meals);
      document.getElementById("all-recipes-section")?.scrollIntoView({ behavior: "smooth" });
    } catch (error) {
      console.error("Category filter failed", error);
      this.renderMealsError("Category recipes could not be loaded.");
    }
  }

  async loadMeal(id) {
    this.renderPage("meal-detail");

    const section = $("#meal-details");
    if (section) section.innerHTML = createLoadingSpinner("Loading recipe details...");

    try {
      const meal = await mealApi.getMealById(id);
      if (!meal) throw new Error("Meal not found");

      this.state.setState({ selectedMeal: meal });
      this.renderMealDetails(meal, null);

      const ingredients = mealApi
        .extractIngredients(meal)
        .map((item) => `${item.measure} ${item.ingredient}`.trim());

      const nutrition = await nutritionApi.analyzeRecipe(meal.strMeal, ingredients);

      this.state.setState({
        mealNutritionCache: { ...this.state.getState().mealNutritionCache, [meal.idMeal]: nutrition },
      });
      this.renderMealDetails(meal, nutrition);
    } catch (error) {
      console.error("Meal detail or nutrition request failed", error);
      const meal = this.state.getState().selectedMeal;
      if (meal) {
        this.renderMealDetails(meal, null, error);
      } else {
        this.showToast("Recipe details could not be loaded.", "error");
      }
    }
  }

  async loadMealFromSlug(slug) {
    const query = slug.replace(/-/g, " ");

    try {
      const meals = await mealApi.searchMeals(query);
      const meal = meals.find((item) => this.slugify(item.strMeal) === slug) || meals[0];
      if (!meal) throw new Error("Recipe not found");

      await this.loadMeal(meal.idMeal);
    } catch (error) {
      console.error("Could not load recipe from URL", error);
      this.navigate("meals");
      this.showToast("Recipe could not be found.", "error");
    }
  }

  renderMealDetails(meal, nutrition, error = null) {
    const section = $("#meal-details");
    if (!section) return;

    const ingredients = mealApi.extractIngredients(meal);
    const instructions = mealApi.parseInstructions(meal.strInstructions);

    const nutritionContent = this.buildNutritionContent(nutrition, error);
    const logButton = this.buildLogMealButton(meal, nutrition);

    const badges = `
      <span class="px-3 py-1 bg-emerald-500 text-white text-sm font-semibold rounded-full">${escapeHtml(meal.strCategory || "Meal")}</span>
      <span class="px-3 py-1 bg-blue-500 text-white text-sm font-semibold rounded-full">${escapeHtml(meal.strArea || "International")}</span>
    `;

    const ingredientsHtml = ingredients
      .map(
        (item) => `
        <label class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-emerald-50 transition-colors">
          <input type="checkbox" class="ingredient-checkbox w-5 h-5 text-emerald-600 rounded border-gray-300"/>
          <span class="text-gray-700"><span class="font-medium text-gray-900">${escapeHtml(item.measure)}</span> ${escapeHtml(item.ingredient)}</span>
        </label>
      `
      )
      .join("");

    const instructionsHtml = instructions
      .map(
        (step, index) => `
        <div class="flex gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors">
          <div class="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">${index + 1}</div>
          <p class="text-gray-700 leading-relaxed pt-2">${escapeHtml(step)}</p>
        </div>
      `
      )
      .join("");

    const videoHtml = meal.strYoutube
      ? `
        <div class="bg-white rounded-2xl shadow-lg p-6">
          <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2"><i class="fa-solid fa-video text-red-500"></i>Video Tutorial</h2>
          <div class="relative aspect-video rounded-xl overflow-hidden bg-gray-100">
            <iframe src="https://www.youtube.com/embed/${encodeURIComponent(meal.strYoutube.split("v=")[1] || "")}" class="absolute inset-0 w-full h-full" frameborder="0" allowfullscreen></iframe>
          </div>
        </div>
      `
      : "";

    section.innerHTML = `
      <div class="max-w-7xl mx-auto">
        <button id="back-to-meals-btn" class="flex items-center gap-2 text-gray-600 hover:text-emerald-600 font-medium mb-6 transition-colors">
          <i class="fa-solid fa-arrow-left"></i><span>Back to Recipes</span>
        </button>

        <div class="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          <div class="relative h-80 md:h-96">
            <img src="${escapeHtml(meal.strMealThumb)}" alt="${escapeHtml(meal.strMeal)}" class="w-full h-full object-cover"/>
            <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
            <div class="absolute bottom-0 left-0 right-0 p-8">
              <div class="flex items-center gap-3 mb-3">${badges}</div>
              <h1 class="text-3xl md:text-4xl font-bold text-white mb-2">${escapeHtml(meal.strMeal)}</h1>
              <div class="flex items-center gap-6 text-white/90">
                <span class="flex items-center gap-2"><i class="fa-solid fa-clock"></i><span>30 min</span></span>
                <span class="flex items-center gap-2"><i class="fa-solid fa-utensils"></i><span>${nutrition ? `${formatNumber(nutrition.servings)} servings` : "Calculating..."}</span></span>
                <span class="flex items-center gap-2"><i class="fa-solid fa-fire"></i><span>${nutrition ? `${formatNumber(nutrition.perServing.calories)} cal/serving` : "Calculating..."}</span></span>
              </div>
            </div>
          </div>
        </div>

        <div class="flex flex-wrap gap-3 mb-8">${logButton}</div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div class="lg:col-span-2 space-y-8">
            <div class="bg-white rounded-2xl shadow-lg p-6">
              <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <i class="fa-solid fa-list-check text-emerald-600"></i>Ingredients
                <span class="text-sm font-normal text-gray-500 ml-auto">${ingredients.length} items</span>
              </h2>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">${ingredientsHtml}</div>
            </div>

            <div class="bg-white rounded-2xl shadow-lg p-6">
              <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2"><i class="fa-solid fa-shoe-prints text-emerald-600"></i>Instructions</h2>
              <div class="space-y-4">${instructionsHtml}</div>
            </div>

            ${videoHtml}
          </div>

          <div class="space-y-6">
            <div class="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
              <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2"><i class="fa-solid fa-chart-pie text-emerald-600"></i>Nutrition Facts</h2>
              <div id="nutrition-facts-container">${nutritionContent}</div>
            </div>
          </div>
        </div>
      </div>
    `;

    $("#back-to-meals-btn")?.addEventListener("click", () => this.navigate("meals"));
    $("#log-meal-btn")?.addEventListener("click", () => this.openLogMealModal(meal, nutrition));
    $("#retry-nutrition-btn")?.addEventListener("click", () => this.loadMeal(meal.idMeal));
  }

  buildNutritionContent(nutrition, error) {
    if (error) {
      return `
        <div class="text-center py-8">
          <i class="fa-solid fa-circle-exclamation text-3xl text-red-400 mb-3"></i>
          <p class="text-gray-600">Unable to load nutrition data</p>
          <button id="retry-nutrition-btn" class="mt-3 text-emerald-600 hover:text-emerald-700 font-medium text-sm"><i class="fa-solid fa-refresh mr-1"></i>Try Again</button>
        </div>
      `;
    }
    if (nutrition) return createNutritionFacts(nutrition);
    return createLoadingSpinner("Calculating nutrition...");
  }

  buildLogMealButton(meal, nutrition) {
    if (!nutrition) {
      return `
        <button id="log-meal-btn" disabled class="flex items-center gap-2 px-6 py-3 bg-gray-300 text-gray-500 rounded-xl font-semibold cursor-not-allowed" title="Waiting for nutrition data...">
          <i class="fa-solid fa-spinner fa-spin"></i><span>Calculating...</span>
        </button>
      `;
    }

    return `
      <button id="log-meal-btn" class="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all" data-meal-id="${escapeHtml(meal.idMeal)}">
        <i class="fa-solid fa-clipboard-list"></i><span>Log This Meal</span>
      </button>
    `;
  }

  openLogMealModal(meal, nutrition) {
    if (!nutrition) return;

    const modal = document.createElement("div");
    modal.id = "log-meal-modal";
    modal.className = "fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4";
    modal.innerHTML = `
      <div class="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
        <div class="flex items-center gap-4 mb-6">
          <img src="${escapeHtml(meal.strMealThumb)}" alt="${escapeHtml(meal.strMeal)}" class="w-16 h-16 rounded-xl object-cover"/>
          <div>
            <h3 class="text-xl font-bold text-gray-900">Log This Meal</h3>
            <p class="text-gray-500 text-sm">${escapeHtml(meal.strMeal)}</p>
          </div>
        </div>

        <div class="mb-6">
          <label class="block text-sm font-semibold text-gray-700 mb-2">Number of Servings</label>
          <div class="flex items-center gap-3">
            <button id="decrease-servings" class="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center"><i class="fa-solid fa-minus text-gray-600"></i></button>
            <input type="number" id="meal-servings" value="1" min="0.5" max="10" step="0.5" class="w-20 text-center text-xl font-bold border-2 border-gray-200 rounded-lg py-2"/>
            <button id="increase-servings" class="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center"><i class="fa-solid fa-plus text-gray-600"></i></button>
          </div>
        </div>

        <div class="bg-emerald-50 rounded-xl p-4 mb-6">
          <p id="modal-nutrition-label" class="text-sm text-gray-600 mb-2">Estimated nutrition per serving:</p>
          <div class="grid grid-cols-4 gap-2 text-center">
            <div><p class="text-lg font-bold text-emerald-600" id="modal-calories">${formatNumber(nutrition.perServing.calories)}</p><p class="text-xs text-gray-500">Calories</p></div>
            <div><p class="text-lg font-bold text-blue-600" id="modal-protein">${formatNumber(nutrition.perServing.protein)}g</p><p class="text-xs text-gray-500">Protein</p></div>
            <div><p class="text-lg font-bold text-amber-600" id="modal-carbs">${formatNumber(nutrition.perServing.carbs)}g</p><p class="text-xs text-gray-500">Carbs</p></div>
            <div><p class="text-lg font-bold text-purple-600" id="modal-fat">${formatNumber(nutrition.perServing.fat)}g</p><p class="text-xs text-gray-500">Fat</p></div>
          </div>
        </div>

        <div class="flex gap-3">
          <button id="cancel-log-meal" class="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all">Cancel</button>
          <button id="confirm-log-meal" class="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all"><i class="fa-solid fa-clipboard-list mr-2"></i>Log Meal</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const servingsInput = $("#meal-servings");

    const updatePreview = () => {
      let servings = Number.parseFloat(servingsInput.value) || 1;
      servings = Math.min(10, Math.max(0.5, servings));
      servingsInput.value = servings;

      $("#modal-nutrition-label").textContent =
        servings === 1 ? "Estimated nutrition per serving:" : `Estimated nutrition for ${servings} servings:`;
      $("#modal-calories").textContent = formatNumber(nutrition.perServing.calories * servings);
      $("#modal-protein").textContent = `${formatNumber(nutrition.perServing.protein * servings)}g`;
      $("#modal-carbs").textContent = `${formatNumber(nutrition.perServing.carbs * servings)}g`;
      $("#modal-fat").textContent = `${formatNumber(nutrition.perServing.fat * servings)}g`;
    };

    $("#decrease-servings").addEventListener("click", () => {
      servingsInput.value = Math.max(0.5, (Number(servingsInput.value) || 1) - 0.5);
      updatePreview();
    });
    $("#increase-servings").addEventListener("click", () => {
      servingsInput.value = Math.min(10, (Number(servingsInput.value) || 1) + 0.5);
      updatePreview();
    });
    servingsInput.addEventListener("input", updatePreview);

    $("#cancel-log-meal").addEventListener("click", () => modal.remove());
    $("#confirm-log-meal").addEventListener("click", () => {
      const servings = Math.min(10, Math.max(0.5, Number(servingsInput.value) || 1));
      this.foodLog.logMeal(meal, servings, nutrition);
      modal.remove();
    });

    modal.addEventListener("click", (event) => {
      if (event.target === modal) modal.remove();
    });
  }

  showSuccessAlert(mealName, servings, calories) {
    const servingText = `${formatNumber(servings)} serving${servings !== 1 ? "s" : ""}`;
    const alertHtml = `
      <p class="nutriplan-swal-description">${escapeHtml(mealName)} (${servingText}) has been added to your daily log.</p>
      <p class="nutriplan-swal-calories">+${formatNumber(calories)} calories</p>
    `;

    if (window.Swal && typeof window.Swal.fire === "function") {
      window.Swal.fire({
        title: "Meal Logged!",
        html: alertHtml,
        icon: "success",
        showConfirmButton: false,
        timer: 3200,
        timerProgressBar: false,
        customClass: {
          popup: "nutriplan-swal-popup",
          icon: "nutriplan-swal-icon",
          title: "nutriplan-swal-title",
          htmlContainer: "nutriplan-swal-html",
        },
      });
    } else {
      this.showSweetAlertFallback(mealName, servingText, calories);
    }

    if (this.currentPage === "foodlog") this.foodLog.render();
  }

  showSweetAlertFallback(mealName, servingText, calories) {
    const alert = document.createElement("div");
    alert.className = "nutriplan-swal-fallback";
    alert.innerHTML = `
      <div class="nutriplan-swal-fallback-popup" role="alertdialog" aria-live="polite">
        <div class="nutriplan-swal-fallback-icon"><i class="fa-solid fa-check"></i></div>
        <h2>Meal Logged!</h2>
        <p>${escapeHtml(mealName)} (${escapeHtml(servingText)}) has been added to your daily log.</p>
        <strong>+${formatNumber(calories)} calories</strong>
      </div>
    `;
    document.body.appendChild(alert);
    window.setTimeout(() => alert.remove(), 3200);
  }

  renderProductsPage() {
    const section = $("#products-section");
    if (!section) return;
    section.style.display = "block";

    const categoryContainer = $("#product-categories");
    if (categoryContainer) {
      categoryContainer.innerHTML = productApi
        .getCategories()
        .map(
          (category) => `
          <button class="product-category-btn flex-shrink-0 px-5 py-3 bg-gradient-to-r ${this.categoryGradient(category.id)} text-white rounded-xl font-semibold hover:shadow-lg transition-all" data-category="${category.id}">
            <i class="fa-solid ${category.icon} mr-2"></i>${category.name}
          </button>
        `
        )
        .join("");
    }

    const grid = $("#products-grid");
    if (grid && !this.state.getState().products.length) {
      grid.innerHTML = createEmptyState("No products to display", "Search for a product or browse by category", "fa-box-open");
    }

    const count = $("#products-count");
    if (count && !this.state.getState().products.length) {
      count.textContent = "Search for products to see results";
    }

    this.setupProductListeners();
  }

  categoryGradient(id) {
    const gradients = {
      breakfast_cereals: "from-amber-500 to-orange-500",
      beverages: "from-blue-500 to-cyan-500",
      snacks: "from-purple-500 to-pink-500",
      dairy: "from-sky-400 to-blue-500",
      fruits: "from-red-500 to-rose-500",
      vegetables: "from-green-500 to-emerald-500",
      breads: "from-amber-600 to-yellow-500",
      meats: "from-red-600 to-rose-600",
      frozen_foods: "from-cyan-500 to-blue-600",
      sauces: "from-orange-500 to-red-500",
    };
    return gradients[id] || "from-gray-500 to-gray-600";
  }

  setupProductListeners() {
    const searchButton = $("#search-product-btn");
    const searchInput = $("#product-search-input");
    const barcodeButton = $("#lookup-barcode-btn");
    const barcodeInput = $("#barcode-input");

    if (searchButton && !searchButton.dataset.bound) {
      searchButton.addEventListener("click", () => this.searchProducts(searchInput.value.trim()));
    }
    if (searchInput && !searchInput.dataset.bound) {
      searchInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") this.searchProducts(searchInput.value.trim());
      });
    }
    if (barcodeButton && !barcodeButton.dataset.bound) {
      barcodeButton.addEventListener("click", () => this.lookupBarcode(barcodeInput.value.trim()));
    }
    if (barcodeInput && !barcodeInput.dataset.bound) {
      barcodeInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") this.lookupBarcode(barcodeInput.value.trim());
      });
    }

    [searchButton, searchInput, barcodeButton, barcodeInput].forEach((element) => {
      if (element) element.dataset.bound = "true";
    });

    document.querySelectorAll(".nutri-score-filter").forEach((button) => {
      if (button.dataset.bound) return;

      button.addEventListener("click", () => {
        document.querySelectorAll(".nutri-score-filter").forEach((item) => item.classList.remove("ring-2", "ring-gray-900"));
        button.classList.add("ring-2", "ring-gray-900");
        this.state.setState({ productGrade: button.dataset.grade || "" });
        if (searchInput.value.trim()) this.searchProducts(searchInput.value.trim(), button.dataset.grade || "");
      });
      button.dataset.bound = "true";
    });

    document.querySelectorAll(".product-category-btn").forEach((button) => {
      if (button.dataset.bound) return;
      button.addEventListener("click", () => this.searchProductsByCategory(button.dataset.category));
      button.dataset.bound = "true";
    });
  }

  async searchProducts(searchTerms, grade = this.state.getState().productGrade) {
    if (!searchTerms) {
      this.showToast("Enter a product name first.", "warning");
      return;
    }

    const grid = $("#products-grid");
    if (grid) grid.innerHTML = createLoadingSpinner("Searching products...");

    try {
      const result = await productApi.searchProducts({ searchTerms, grade });
      this.state.setState({ products: result.products });

      if (grid) {
        grid.innerHTML = result.products.length
          ? result.products.map(createProductCard).join("")
          : createEmptyState("No products found", `No products matched "${searchTerms}"`, "fa-box-open");
      }

      const count = $("#products-count");
      if (count) {
        count.textContent = result.products.length
          ? `Found ${result.count} products for "${searchTerms}"`
          : `No products found for "${searchTerms}"`;
      }
    } catch (error) {
      console.error("Product search failed", error);
      if (grid) grid.innerHTML = createEmptyState("Unable to search products", "Please check your connection and try again.", "fa-circle-exclamation");
      $("#products-count").textContent = "Error searching products";
    }
  }

  async searchProductsByCategory(category) {
    const grid = $("#products-grid");
    if (grid) grid.innerHTML = createLoadingSpinner("Loading category products...");

    try {
      const result = await productApi.getProductsByCategory(category);
      this.state.setState({ products: result.products });

      const categoryName = category.replaceAll("_", " ");
      if (grid) {
        grid.innerHTML = result.products.length
          ? result.products.map(createProductCard).join("")
          : createEmptyState("No products found", `No products found in ${categoryName}`, "fa-box-open");
      }

      $("#products-count").textContent = result.products.length
        ? `Found ${result.count} products in ${categoryName}`
        : `No products found in ${categoryName}`;
    } catch (error) {
      console.error("Product category request failed", error);
      if (grid) grid.innerHTML = createEmptyState("Unable to load products", "Please try again.", "fa-circle-exclamation");
    }
  }

  async lookupBarcode(barcode) {
    if (!barcode) {
      this.showToast("Enter a barcode first.", "warning");
      return;
    }

    const grid = $("#products-grid");
    if (grid) grid.innerHTML = createLoadingSpinner("Looking up barcode...");

    try {
      const product = await productApi.getProductByBarcode(barcode);

      if (!product) {
        if (grid) grid.innerHTML = createEmptyState("Product not found", `No product found with barcode: ${barcode}`, "fa-barcode");
        $("#products-count").textContent = `No product found with barcode: ${barcode}`;
        this.showToast("Product not found in database.", "error");
        return;
      }

      this.state.setState({ products: [product] });
      if (grid) grid.innerHTML = createProductCard(product);
      $("#products-count").textContent = `Found product: ${product.name}`;
      this.openProductModal(product);
    } catch (error) {
      console.error("Barcode lookup failed", error);
      if (grid) grid.innerHTML = createEmptyState("Unable to look up barcode", "Please try again.", "fa-circle-exclamation");
    }
  }

  openProductModal(product) {
    const modal = document.createElement("div");
    modal.id = "product-detail-modal";
    modal.className = "fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4";
    modal.innerHTML = `
      <div class="bg-white rounded-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        ${createProductDetailContent(product, productApi.getNutriScoreInfo(product.nutritionGrade))}
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelectorAll(".close-product-modal").forEach((button) => button.addEventListener("click", () => modal.remove()));
    modal.querySelector(".add-product-to-log")?.addEventListener("click", () => {
      this.foodLog.logProduct(product);
      modal.remove();
    });
    modal.addEventListener("click", (event) => {
      if (event.target === modal) modal.remove();
    });
  }

  showToast(message, type = "info") {
    const colors = { success: "bg-emerald-500", error: "bg-red-500", warning: "bg-amber-500", info: "bg-blue-500" };

    const toast = document.createElement("div");
    toast.className = `fixed bottom-4 right-4 ${colors[type] || colors.info} text-white px-6 py-3 rounded-lg shadow-lg z-[80] toast-notification`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 3000);
  }

  // single click handler for the whole document, catches clicks on nav links, cards and buttons
  handleDocumentClick(event) {
    const navLink = event.target.closest("#sidebar .nav-link");
    if (navLink) {
      event.preventDefault();
      const text = navLink.textContent.toLowerCase();
      this.navigate(text.includes("product") ? "products" : text.includes("food log") ? "foodlog" : "meals");
      return;
    }

    const quickAction = event.target.closest(".quick-log-btn");
    if (quickAction) {
      const action = quickAction.dataset.action;
      if (action === "products") this.navigate("products");
      else if (action === "meals") this.navigate("meals");
      else this.showToast("Custom entries are not available yet. Use a recipe or product entry.", "info");
      return;
    }

    const area = event.target.closest(".area-filter");
    if (area) {
      this.filterByArea(area.dataset.area);
      return;
    }

    const category = event.target.closest(".category-card");
    if (category) {
      this.filterByCategory(category.dataset.category);
      return;
    }

    const mealCard = event.target.closest(".recipe-card");
    if (mealCard) {
      this.navigateToMeal({ idMeal: mealCard.dataset.mealId, strMeal: mealCard.querySelector("h3")?.textContent || "meal" });
      return;
    }

    const productCard = event.target.closest(".product-card");
    if (productCard) {
      const product = this.state.getState().products.find((item) => item.barcode === productCard.dataset.barcode);
      if (product) this.openProductModal(product);
      return;
    }

    const removeButton = event.target.closest(".remove-log-item");
    if (removeButton) {
      this.state.removeLogItem(Number(removeButton.dataset.logIndex));
      this.foodLog.render();
      return;
    }

    if (event.target.closest("#clear-foodlog")) {
      this.state.clearTodayLog();
      this.foodLog.render();
      return;
    }

    if (event.target.closest("#grid-view-btn")) {
      this.state.setState({ viewMode: "grid" });
      this.renderRecipeGrid(this.state.getState().meals);
      return;
    }

    if (event.target.closest("#list-view-btn")) {
      this.state.setState({ viewMode: "list" });
      this.renderRecipeGrid(this.state.getState().meals);
    }
  }

  toggleSidebar() {
    $("#sidebar")?.classList.toggle("open");
    $("#sidebar-overlay")?.classList.toggle("active");
  }

  closeSidebar() {
    $("#sidebar")?.classList.remove("open");
    $("#sidebar-overlay")?.classList.remove("active");
  }

  hideLoadingOverlay() {
    const overlay = $("#app-loading-overlay");
    if (overlay) {
      overlay.style.opacity = "0";
      setTimeout(() => overlay.remove(), 500);
    }
  }
}

new NutriPlanApp();