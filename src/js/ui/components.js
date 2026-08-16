function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatNumber(value) {
  const number = Number(value) || 0;
  return Number.isInteger(number) ? String(number) : number.toFixed(1);
}

export function createLoadingSpinner(message = "Loading...") {
  return `
    <div class="flex flex-col items-center justify-center py-12 text-center app-loading-state">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
      <p class="text-gray-500">${escapeHtml(message)}</p>
    </div>
  `;
}

export function createEmptyState(title, description, icon = "fa-search") {
  const descriptionHtml = description ? `<p class="text-gray-400 text-sm mt-2">${escapeHtml(description)}</p>` : "";

  return `
    <div class="flex flex-col items-center justify-center py-12 text-center app-empty-state">
      <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <i class="fa-solid ${icon} text-gray-400 text-2xl"></i>
      </div>
      <p class="text-gray-500 text-lg font-medium">${escapeHtml(title)}</p>
      ${descriptionHtml}
    </div>
  `;
}

// icon + color pairs per meal category, used by createCategoryCard
const categoryIcons = {
  Beef: "fa-drumstick-bite",
  Chicken: "fa-drumstick-bite",
  Dessert: "fa-cake-candles",
  Lamb: "fa-drumstick-bite",
  Miscellaneous: "fa-bowl-food",
  Pasta: "fa-bowl-food",
  Pork: "fa-bacon",
  Seafood: "fa-fish",
  Side: "fa-carrot",
  Starter: "fa-utensils",
  Vegan: "fa-leaf",
  Vegetarian: "fa-seedling",
};

const categoryColors = {
  Beef: ["#fff1f2", "#fb7185"],
  Chicken: ["#fffbeb", "#f59e0b"],
  Dessert: ["#fff1f2", "#ec4899"],
  Lamb: ["#fffbeb", "#f59e0b"],
  Miscellaneous: ["#f8fafc", "#64748b"],
  Pasta: ["#fefce8", "#eab308"],
  Pork: ["#fff1f2", "#f43f5e"],
  Seafood: ["#eff6ff", "#0ea5e9"],
  Side: ["#ecfdf5", "#10b981"],
  Starter: ["#ecfeff", "#06b6d4"],
  Vegan: ["#ecfdf5", "#10b981"],
  Vegetarian: ["#f7fee7", "#84cc16"],
};

export function createCategoryCard(category) {
  const name = category.strCategory || category.name || "Category";
  const icon = categoryIcons[name] || "fa-utensils";
  const [background, accent] = categoryColors[name] || ["#f0fdf4", "#10b981"];

  return `
    <button class="category-card text-left rounded-xl p-3 border cursor-pointer transition-all group" data-category="${escapeHtml(name)}" style="background:${background};border-color:${accent}55">
      <div class="flex items-center gap-2.5">
        <div class="text-white w-9 h-9 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm" style="background:${accent}">
          <i class="fa-solid ${icon}"></i>
        </div>
        <h3 class="text-sm font-bold text-gray-900">${escapeHtml(name)}</h3>
      </div>
    </button>
  `;
}

export function createAreaChip(area, selected = false) {
  const label = area === "" ? "All Cuisines" : area;
  const activeClasses = selected ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200";

  return `
    <button class="area-filter px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-all ${activeClasses}" data-area="${escapeHtml(area)}">
      ${escapeHtml(label)}
    </button>
  `;
}

export function createMealCard(meal) {
  const description = (meal.strInstructions || "Delicious recipe to try!").replace(/\s+/g, " ");
  const category = meal.strCategory || "Meal";
  const area = meal.strArea || "International";

  return `
    <article class="recipe-card bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group" data-meal-id="${escapeHtml(meal.idMeal)}">
      <div class="relative h-48 overflow-hidden">
        <img class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" src="${escapeHtml(meal.strMealThumb)}" alt="${escapeHtml(meal.strMeal)}" loading="lazy" />
        <div class="absolute bottom-3 left-3 flex gap-2 flex-wrap">
          <span class="px-2 py-1 bg-white/90 backdrop-blur-sm text-xs font-semibold rounded-full text-gray-700"><i class="fa-solid fa-tag text-emerald-600 mr-1"></i>${escapeHtml(category)}</span>
          <span class="px-2 py-1 bg-white/90 backdrop-blur-sm text-xs font-semibold rounded-full text-gray-700"><i class="fa-solid fa-globe text-blue-500 mr-1"></i>${escapeHtml(area)}</span>
        </div>
      </div>
      <div class="p-4">
        <h3 class="text-base font-bold text-gray-900 mb-1 group-hover:text-emerald-600 transition-colors line-clamp-1">${escapeHtml(meal.strMeal)}</h3>
        <p class="text-xs text-gray-600 mb-3 line-clamp-2">${escapeHtml(description)}</p>
        <div class="flex items-center justify-between text-xs">
          <span class="font-semibold text-gray-900"><i class="fa-solid fa-utensils text-emerald-600 mr-1"></i>${escapeHtml(category)}</span>
          <span class="font-semibold text-gray-500"><i class="fa-solid fa-globe text-blue-500 mr-1"></i>${escapeHtml(area)}</span>
        </div>
      </div>
    </article>
  `;
}

const nutriScoreColors = { A: "bg-green-500", B: "bg-lime-500", C: "bg-yellow-500", D: "bg-orange-500", E: "bg-red-500" };

export function createProductCard(product) {
  const grade = String(product.nutritionGrade || "").toUpperCase();
  const image = product.image || product.thumbnailImage;

  const imageMarkup = image
    ? `<img class="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300" src="${escapeHtml(image)}" alt="${escapeHtml(product.name)}" loading="lazy" />`
    : `<i class="fa-solid fa-box-open text-gray-300 text-5xl"></i>`;

  const gradeBadge = grade
    ? `<div class="absolute top-2 left-2 ${nutriScoreColors[grade] || "bg-gray-500"} text-white text-xs font-bold px-2 py-1 rounded uppercase">Nutri-Score ${grade}</div>`
    : "";

  const novaBadge = product.novaGroup
    ? `<div class="absolute top-2 right-2 bg-lime-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center" title="NOVA ${escapeHtml(product.novaGroup)}">${escapeHtml(product.novaGroup)}</div>`
    : "";

  const quantityMarkup = product.quantity
    ? `<span><i class="fa-solid fa-weight-scale mr-1"></i>${escapeHtml(product.quantity)}</span>`
    : "";

  return `
    <article class="product-card bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group" data-barcode="${escapeHtml(product.barcode)}">
      <div class="relative h-40 bg-gray-100 flex items-center justify-center overflow-hidden">
        ${imageMarkup}
        ${gradeBadge}
        ${novaBadge}
      </div>
      <div class="p-4">
        <p class="text-xs text-emerald-600 font-semibold mb-1 truncate">${escapeHtml(product.brand || "Product")}</p>
        <h3 class="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-emerald-600 transition-colors">${escapeHtml(product.name)}</h3>
        <div class="flex items-center gap-3 text-xs text-gray-500 mb-3">
          ${quantityMarkup}
          <span><i class="fa-solid fa-fire mr-1"></i>${formatNumber(product.nutrition.calories)} kcal/100g</span>
        </div>
        <div class="grid grid-cols-4 gap-1 text-center">
          <div class="bg-emerald-50 rounded p-1.5"><p class="text-xs font-bold text-emerald-700">${formatNumber(product.nutrition.protein)}g</p><p class="text-[10px] text-gray-500">Protein</p></div>
          <div class="bg-blue-50 rounded p-1.5"><p class="text-xs font-bold text-blue-700">${formatNumber(product.nutrition.carbs)}g</p><p class="text-[10px] text-gray-500">Carbs</p></div>
          <div class="bg-purple-50 rounded p-1.5"><p class="text-xs font-bold text-purple-700">${formatNumber(product.nutrition.fat)}g</p><p class="text-[10px] text-gray-500">Fat</p></div>
          <div class="bg-orange-50 rounded p-1.5"><p class="text-xs font-bold text-orange-700">${formatNumber(product.nutrition.sugar)}g</p><p class="text-[10px] text-gray-500">Sugar</p></div>
        </div>
      </div>
    </article>
  `;
}

// one nutrition row with a label, amount and a progress bar relative to "max"
function nutritionBar(label, amount, color, max) {
  const percentage = Math.min(100, Math.round(((Number(amount) || 0) / max) * 100));

  return `
    <div class="nutrition-row">
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center gap-2"><div class="w-3 h-3 rounded-full" style="background:${color}"></div><span class="text-gray-700">${label}</span></div>
        <span class="font-bold text-gray-900">${formatNumber(amount)}g</span>
      </div>
      <div class="w-full bg-gray-100 rounded-full h-2"><div class="h-2 rounded-full" style="width:${percentage}%;background:${color}"></div></div>
    </div>
  `;
}

export function createNutritionFacts(nutrition) {
  if (!nutrition) {
    return createEmptyState("Nutrition unavailable", "Try loading the recipe again.", "fa-circle-exclamation");
  }

  const values = nutrition.perServing;
  const totals = nutrition.totals;

  return `
    <p class="text-sm text-gray-500 mb-4">Per serving</p>
    <div class="text-center py-4 mb-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl">
      <p class="text-sm text-gray-600">Calories per serving</p>
      <p class="text-4xl font-bold text-emerald-600">${formatNumber(values.calories)}</p>
      <p class="text-xs text-gray-500 mt-1">Total: ${formatNumber(totals.calories)} cal</p>
    </div>
    <div class="space-y-4">
      ${nutritionBar("Protein", values.protein, "#10b981", 50)}
      ${nutritionBar("Carbs", values.carbs, "#3b82f6", 300)}
      ${nutritionBar("Fat", values.fat, "#a855f7", 65)}
      ${nutritionBar("Fiber", values.fiber, "#f97316", 25)}
      ${nutritionBar("Sugar", values.sugar, "#ec4899", 50)}
    </div>
    <div class="mt-6 pt-6 border-t border-gray-100">
      <h3 class="text-sm font-semibold text-gray-900 mb-3">Other Nutrition</h3>
      <div class="grid grid-cols-2 gap-3 text-sm">
        <div class="flex justify-between"><span class="text-gray-600">Saturated fat</span><span class="font-medium">${formatNumber(values.saturatedFat)}g</span></div>
        <div class="flex justify-between"><span class="text-gray-600">Cholesterol</span><span class="font-medium">${formatNumber(values.cholesterol)}mg</span></div>
        <div class="flex justify-between"><span class="text-gray-600">Sodium</span><span class="font-medium">${formatNumber(values.sodium)}mg</span></div>
        <div class="flex justify-between"><span class="text-gray-600">Total weight</span><span class="font-medium">${formatNumber(nutrition.totalWeight)}g</span></div>
      </div>
    </div>
  `;
}

export function createProductDetailContent(product, scoreInfo) {
  const nutrition = product.nutrition || {};

  const imageMarkup = product.image
    ? `<img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" class="w-full h-full object-contain" />`
    : `<i class="fa-solid fa-box-open text-gray-300 text-3xl"></i>`;

  const ingredientsHtml = product.ingredients
    ? `
      <div class="bg-gray-50 rounded-xl p-5 mb-6">
        <h3 class="font-bold text-gray-900 mb-3"><i class="fa-solid fa-list text-gray-600 mr-2"></i>Ingredients</h3>
        <p class="text-sm text-gray-600 leading-relaxed">${escapeHtml(product.ingredients)}</p>
      </div>
    `
    : "";

  const allergensHtml = product.allergens
    ? `
      <div class="bg-red-50 rounded-xl p-5 mb-6 border border-red-200">
        <h3 class="font-bold text-red-700 mb-2"><i class="fa-solid fa-triangle-exclamation mr-2"></i>Allergens</h3>
        <p class="text-sm text-red-600">${escapeHtml(product.allergens)}</p>
      </div>
    `
    : "";

  return `
    <div class="p-6">
      <div class="flex items-start justify-between gap-4 mb-6">
        <div class="flex items-center gap-4">
          <div class="w-24 h-24 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden">${imageMarkup}</div>
          <div>
            <p class="text-sm text-emerald-600 font-semibold">${escapeHtml(product.brand || "Product")}</p>
            <h2 class="text-2xl font-bold text-gray-900">${escapeHtml(product.name)}</h2>
            <p class="text-sm text-gray-500">${escapeHtml(product.quantity || product.servingSize || "Nutrition per 100g")}</p>
          </div>
        </div>
        <button class="close-product-modal text-gray-400 hover:text-gray-700" aria-label="Close product details"><i class="fa-solid fa-xmark text-xl"></i></button>
      </div>

      <div class="grid grid-cols-3 gap-4 mb-6">
        <div class="bg-emerald-50 rounded-xl p-4 text-center">
          <i class="fa-solid fa-star text-emerald-600 text-2xl mb-2"></i>
          <p class="text-xs text-gray-500 mb-1">Nutri-Score</p>
          <p class="text-lg font-bold" style="color:${scoreInfo.color}">${escapeHtml(String(product.nutritionGrade || "?").toUpperCase())}</p>
        </div>
        <div class="bg-blue-50 rounded-xl p-4 text-center">
          <i class="fa-solid fa-fire text-blue-600 text-2xl mb-2"></i>
          <p class="text-xs text-gray-500 mb-1">Calories</p>
          <p class="text-lg font-bold text-gray-900">${formatNumber(nutrition.calories)} kcal</p>
        </div>
        <div class="bg-purple-50 rounded-xl p-4 text-center">
          <i class="fa-solid fa-barcode text-purple-600 text-2xl mb-2"></i>
          <p class="text-xs text-gray-500 mb-1">Barcode</p>
          <p class="text-sm font-bold text-gray-900 break-all">${escapeHtml(product.barcode)}</p>
        </div>
      </div>

      <div class="bg-gray-50 rounded-xl p-5 mb-6">
        <h3 class="font-bold text-gray-900 mb-3">Nutrition per 100g</h3>
        <div class="grid grid-cols-4 gap-3 text-center">
          <div><p class="text-sm font-semibold text-emerald-700">${formatNumber(nutrition.protein)}g</p><p class="text-xs text-gray-500">Protein</p></div>
          <div><p class="text-sm font-semibold text-blue-700">${formatNumber(nutrition.carbs)}g</p><p class="text-xs text-gray-500">Carbs</p></div>
          <div><p class="text-sm font-semibold text-purple-700">${formatNumber(nutrition.fat)}g</p><p class="text-xs text-gray-500">Fat</p></div>
          <div><p class="text-sm font-semibold text-orange-700">${formatNumber(nutrition.sugar)}g</p><p class="text-xs text-gray-500">Sugar</p></div>
        </div>
      </div>

      ${ingredientsHtml}
      ${allergensHtml}

      <div class="flex gap-3">
        <button class="add-product-to-log flex-1 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-all"><i class="fa-solid fa-plus mr-2"></i>Log This Food</button>
        <button class="close-product-modal flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all">Close</button>
      </div>
    </div>
  `;
}

export function createLoggedItem(item, index) {
  const nutrition = item.nutrition || {};
  const image = item.thumbnail;
  const loggedTime = item.loggedAt
    ? new Date(item.loggedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    : "Today";
  const itemType = item.type === "product" ? "Product" : "Recipe";

  const imageMarkup = image
    ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(item.name)}" class="w-12 h-12 rounded-full object-cover shrink-0" />`
    : `<div class="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center shrink-0"><i class="fa-solid fa-utensils text-emerald-600"></i></div>`;

  return `
    <div class="logged-food-item flex items-center gap-4 py-4 border-b border-gray-100 last:border-b-0">
      <div class="flex items-center gap-3 min-w-0 flex-1">
        ${imageMarkup}
        <div class="min-w-0">
          <p class="font-semibold text-gray-900 truncate">${escapeHtml(item.name)}</p>
          <p class="text-sm text-gray-500">${formatNumber(item.servings || 1)} serving${item.servings !== 1 ? "s" : ""} <span class="text-gray-300 mx-1">·</span> <span class="text-emerald-600 font-medium">${itemType}</span></p>
          <p class="text-xs text-gray-400">${escapeHtml(loggedTime)}</p>
        </div>
      </div>
      <div class="flex items-center gap-3 shrink-0">
        <div class="text-right min-w-[72px]"><p class="font-bold text-emerald-600 text-lg leading-none">${formatNumber(nutrition.calories)}</p><p class="text-xs text-gray-400 mt-1">kcal</p></div>
        <div class="logged-macros hidden sm:flex items-center gap-1 text-xs text-gray-500"><span class="bg-emerald-50 rounded px-2 py-1">${formatNumber(nutrition.protein)}g P</span><span class="bg-blue-50 rounded px-2 py-1">${formatNumber(nutrition.carbs)}g C</span><span class="bg-purple-50 rounded px-2 py-1">${formatNumber(nutrition.fat)}g F</span></div>
        <button class="remove-log-item text-gray-400 hover:text-red-500 p-2" data-log-index="${index}" title="Remove item" aria-label="Remove ${escapeHtml(item.name)}"><i class="fa-solid fa-trash-can"></i></button>
      </div>
    </div>
  `;
}

export function formatDate(date) {
  return date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

export { escapeHtml, formatNumber };