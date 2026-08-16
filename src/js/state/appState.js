const DAILY_LOG_KEY = "nutriplan_daily_log";
const SAVED_RECIPES_KEY = "nutriplan_saved_recipes";

// small helper to read + parse JSON from localStorage, falls back if missing or broken
function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    console.warn(`Could not read ${key}`, error);
    return fallback;
  }
}

export class AppState {
  constructor() {
    this.state = {
      currentPage: "meals",
      searchQuery: "",
      selectedCategory: "",
      selectedArea: "",
      selectedMeal: null,
      categories: [],
      areas: [],
      meals: [],
      viewMode: "grid",
      mealNutritionCache: {},
      products: [],
      productGrade: "",
      dailyLog: {},
      savedRecipes: [],
    };
  }

  initialize() {
    this.state.dailyLog = readStorage(DAILY_LOG_KEY, {});
    this.state.savedRecipes = readStorage(SAVED_RECIPES_KEY, []);
    return this.state;
  }

  getState() {
    return this.state;
  }

  setState(values) {
    this.state = { ...this.state, ...values };
    window.dispatchEvent(new CustomEvent("nutriplan:statechange", { detail: values }));
  }

  saveDailyLog() {
    try {
      localStorage.setItem(DAILY_LOG_KEY, JSON.stringify(this.state.dailyLog));
    } catch (error) {
      console.warn("Could not save the food log", error);
    }
  }

  saveSavedRecipes() {
    try {
      localStorage.setItem(SAVED_RECIPES_KEY, JSON.stringify(this.state.savedRecipes));
    } catch (error) {
      console.warn("Could not save saved recipes", error);
    }
  }

  getTodayString() {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${today.getFullYear()}-${month}-${day}`;
  }

  // makes sure today's entry exists in the daily log before returning it
  getTodayLog() {
    const date = this.getTodayString();

    if (!this.state.dailyLog[date]) {
      this.state.dailyLog[date] = {
        meals: [],
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0,
      };
    }

    return this.state.dailyLog[date];
  }

  addLogItem(item) {
    const todayLog = this.getTodayLog();

    todayLog.meals.push(item);
    todayLog.totalCalories += item.nutrition.calories || 0;
    todayLog.totalProtein += item.nutrition.protein || 0;
    todayLog.totalCarbs += item.nutrition.carbs || 0;
    todayLog.totalFat += item.nutrition.fat || 0;

    this.saveDailyLog();
    this.setState({ dailyLog: this.state.dailyLog });
  }

  removeLogItem(index) {
    const todayLog = this.getTodayLog();
    const removed = todayLog.meals.splice(index, 1)[0];

    if (removed) {
      todayLog.totalCalories -= removed.nutrition.calories || 0;
      todayLog.totalProtein -= removed.nutrition.protein || 0;
      todayLog.totalCarbs -= removed.nutrition.carbs || 0;
      todayLog.totalFat -= removed.nutrition.fat || 0;
    }

    this.saveDailyLog();
    this.setState({ dailyLog: this.state.dailyLog });
  }

  clearTodayLog() {
    const date = this.getTodayString();
    delete this.state.dailyLog[date];
    this.saveDailyLog();
    this.setState({ dailyLog: this.state.dailyLog });
  }
}

export const appState = new AppState();