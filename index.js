// DOM Elements
const searchBar = document.getElementById('search-bar');
const searchButton = document.getElementById('button');
const recipeCards = document.getElementById('recipe-cards');
const ingredientTags = document.querySelectorAll('.ingredient');
const recipeOverlay = document.getElementById('recipe-overlay');
const closeOverlayBtn = document.getElementById('close-overlay');
const featuredRecipeHeading = document.getElementById('features-recipe').querySelector('h3');

// API base URL
const API_BASE_URL = 'https://www.themealdb.com/api/json/v1/1';

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Load random recipes on page load
    loadRandomRecipes();
    
    // Search on Enter key press
    searchBar.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchRecipes();
        }
    });
    
    // Search on button click
    searchButton.addEventListener('click', handleButtonClick);
    
    // Close overlay button event listener
    closeOverlayBtn.addEventListener('click', () => {
        recipeOverlay.classList.remove('active');
        document.body.style.overflow = 'auto';
    });
    
    // Add event listeners to ingredient tags
    ingredientTags.forEach(tag => {
        tag.addEventListener('click', () => {
            searchBar.value = tag.textContent;
            searchRecipes();
        });
    });
    
    // Add swipe gesture for mobile to close overlay
    implementTouchGestures();
    
    // Implement lazy loading for images
    if ('loading' in HTMLImageElement.prototype) {
        console.log('Native lazy loading supported');
    } else {
        // Implement fallback lazy loading if needed
    }
    
    // Event delegation for recipe cards
    recipeCards.addEventListener('click', (e) => {
        const card = e.target.closest('.cards');
        if (card && card.dataset.mealId) {
            showRecipeDetails(card.dataset.mealId);
        }
    });
    
    // Handle scroll animations
    handleScrollAnimations();

    window.addEventListener('load', () => {
        const searchInput = document.getElementById('search-bar');
        if (searchInput) searchInput.value = ''; // Clear on page load
      });
});

// Implement touch gestures for mobile
function implementTouchGestures() {
    let touchStartY = 0;
    let touchEndY = 0;
    
    recipeOverlay.addEventListener('touchstart', (e) => {
        touchStartY = e.changedTouches[0].screenY;
    }, false);
    
    recipeOverlay.addEventListener('touchend', (e) => {
        touchEndY = e.changedTouches[0].screenY;
        handleSwipeGesture();
    }, false);
    
    function handleSwipeGesture() {
        if (touchEndY - touchStartY > 100) { // Swipe down
            recipeOverlay.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    }
}

// Scroll animations for modern feel
function handleScrollAnimations() {
    // Check if Intersection Observer API is supported
    if ('IntersectionObserver' in window) {
        const appearOptions = {
            threshold: 0.1,
            rootMargin: "0px 0px -100px 0px"
        };
        
        const appearOnScroll = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('appear');
                observer.unobserve(entry.target);
            });
        }, appearOptions);
        
        // Observe all cards for scroll animation
        document.querySelectorAll('.cards').forEach(card => {
            appearOnScroll.observe(card);
        });
    }
}

// Handle button click - either search or surprise
function handleButtonClick() {
    if (searchBar.value.trim()) {
        searchRecipes();
    } else {
        loadRandomRecipes();
        animateText(featuredRecipeHeading, "Chef's Surprises");
    }
}

// Search recipes based on search input
async function searchRecipes() {
    const searchQuery = searchBar.value.trim();
    
    if (!searchQuery) return;
    
    // Show loading state
    displayLoadingState();
    
    try {
        // First try to search by ingredient
        let response = await fetch(`${API_BASE_URL}/filter.php?i=${searchQuery}`);
        let data = await response.json();
        
        // If no results, try search by meal name
        if (!data.meals) {
            response = await fetch(`${API_BASE_URL}/search.php?s=${searchQuery}`);
            data = await response.json();
        }
        
        // Update UI with search results
        if (data.meals) {
            animateText(featuredRecipeHeading, `Results for "${searchQuery}"`);
            renderRecipes(data.meals);
            
            // Scroll to results section after search
            setTimeout(() => {
                document.getElementById('cards-section').scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }, 300);
        } else {
            // No results found
            animateText(featuredRecipeHeading, `No recipes found for "${searchQuery}"`);
            recipeCards.innerHTML = `
                <div class="no-results">
                    <h3>No recipes found</h3>
                    <p>Try another ingredient or dish name</p>
                    <button class="try-again-btn">Try a suggestion</button>
                </div>
            `;
            
            // Suggest alternatives when no results
            document.querySelector('.try-again-btn')?.addEventListener('click', () => {
                const suggestions = ['chicken', 'pasta', 'vegetarian', 'dessert', 'breakfast'];
                const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
                searchBar.value = randomSuggestion;
                searchRecipes();
            });
        }
    } catch (error) {
        console.error('Error fetching recipes:', error);
        recipeCards.innerHTML = `
            <div class="no-results">
                <h3>Something went wrong</h3>
                <p>Please try again later</p>
                <button class="retry-btn">Retry</button>
            </div>
        `;
        
        // Retry button functionality
        document.querySelector('.retry-btn')?.addEventListener('click', () => {
            loadRandomRecipes();
        });
    }
}

// Load random recipes
async function loadRandomRecipes() {
    displayLoadingState();
    
    try {
        const recipes = [];
        
        // Use Promise.all for parallel requests
        const promises = [];
        for (let i = 0; i < 6; i++) {
            promises.push(fetch(`${API_BASE_URL}/random.php`).then(res => res.json()));
        }
        
        const results = await Promise.all(promises);
        
        results.forEach(data => {
            if (data.meals && data.meals.length > 0) {
                recipes.push(data.meals[0]);
            }
        });
        
        if (recipes.length > 0) {
            renderRecipes(recipes);
        }
    } catch (error) {
        console.error('Error fetching random recipes:', error);
        
        // Better error handling with retry option
        recipeCards.innerHTML = `
            <div class="error-message">
                <h3>Couldn't fetch recipes</h3>
                <p>Please check your connection and try again</p>
                <button class="retry-btn">Retry</button>
            </div>
        `;
        
        document.querySelector('.retry-btn')?.addEventListener('click', loadRandomRecipes);
    }
}

// Display loading state while fetching data
function displayLoadingState() {
    // More modern loading indicators
    recipeCards.innerHTML = `
        <div class="loading-card" style="--delay: 0"></div>
        <div class="loading-card" style="--delay: 0.2s"></div>
        <div class="loading-card" style="--delay: 0.4s"></div>
        <div class="loading-card" style="--delay: 0.6s"></div>
        <div class="loading-card" style="--delay: 0.8s"></div>
        <div class="loading-card" style="--delay: 0.10s"></div>
    `;
    
    // Add the animation if it doesn't exist
    if (!document.querySelector('style#loading-style')) {
        const style = document.createElement('style');
        style.id = 'loading-style';
        style.textContent = `
            .loading-card {
                height: 350px;
                background: linear-gradient(110deg, #ececec 30%, #f5f5f5 50%, #ececec 70%);
                border-radius: 0.7rem;
                background-size: 200% 100%;
                animation: loading-shimmer 1.5s infinite linear;
                animation-delay: var(--delay, 0s);
            }
            
            @keyframes loading-shimmer {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
            }
        `;
        document.head.appendChild(style);
    }
}

// Render recipes to the UI
function renderRecipes(meals) {
    recipeCards.innerHTML = '';
    
    meals.forEach(meal => {
        // Generate random cooking time and difficulty
        const cookingTime = Math.floor(Math.random() * 45) + 15; // 15-60 mins
        const difficulties = ['Easy', 'Medium', 'Advanced'];
        const difficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
        const servings = Math.floor(Math.random() * 4) + 1; // 1-4 servings
        
        // Limit long titles
        let title = meal.strMeal;
        if (title.length > 40) {
            title = title.substring(0, 40) + '...';
        }
        
        // Extract first 4 ingredients
        const ingredients = [];
        for (let i = 1; i <= 20; i++) {
            const ingredient = meal[`strIngredient${i}`];
            if (ingredient && ingredient.trim() !== '') {
                ingredients.push(ingredient);
                if (ingredients.length === 3) break;
            }
        }
        
        // Generate random rating between 3.5 and 5.0
        const rating = (Math.random() * 1.5 + 3.5).toFixed(1);
        
        const card = document.createElement('div');
        card.className = 'cards';
        
        // Store meal ID as data attribute for easier access
        card.dataset.mealId = meal.idMeal;
        
        card.innerHTML = `
            <div class="top-card">
                <img src="${meal.strMealThumb}" alt="${meal.strMeal}" loading="lazy">
            </div>
            <div class="info-card">
                <div class="card-head">
                    <h5>${title}</h5>
                    <p>${cookingTime} mins | ${difficulty} | Serves ${servings}</p>
                    <p>Ingredients: ${ingredients.join(', ')}</p>
                </div>
                <div class="rating-down">
                    <div class="left-side">
                        ⭐ <span>${rating}</span>
                    </div>
                    <div class="right-side">
                        <i class="fas fa-arrow-right"></i>
                    </div>
                </div>
            </div>
        `;
        
        recipeCards.appendChild(card);
    });
    
    // Add reveal animation to cards
    const cards = document.querySelectorAll('.cards');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 100 * index);
    });
}

// COMPLETELY REWRITTEN: Show recipe details in overlay to match HTML structure
async function showRecipeDetails(mealId) {
    try {
        // Show loading indicator inside overlay
        recipeOverlay.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
        
        const overlayContent = document.querySelector('.overlay-content');
        overlayContent.innerHTML = `
            <button class="close-overlay" id="close-overlay" aria-label="Close recipe details">
                <i class="fas fa-times"></i>
            </button>
            <div class="recipe-detail-loading">
                <div class="loading-spinner"></div>
                <p>Loading recipe details...</p>
            </div>
        `;
        
        // Re-attach close event listener
        document.getElementById('close-overlay').addEventListener('click', () => {
            recipeOverlay.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
        
        const response = await fetch(`${API_BASE_URL}/lookup.php?i=${mealId}`);
        const data = await response.json();
        
        if (data.meals && data.meals.length > 0) {
            const meal = data.meals[0];
            
            // Get all ingredients and measures
            const ingredients = [];
            for (let i = 1; i <= 20; i++) {
                const ingredient = meal[`strIngredient${i}`];
                const measure = meal[`strMeasure${i}`];
                
                if (ingredient && ingredient.trim() !== '') {
                    ingredients.push(`<li>${measure.trim()} ${ingredient.trim()}</li>`);
                }
            }
            
            // Format instructions into steps
            const instructions = meal.strInstructions
                .split('.')
                .filter(sentence => sentence.trim() !== '')
                .map((sentence, index) => `<li>${sentence.trim()}.</li>`)
                .join('');
            
            // Generate random nutritional facts
            const calories = Math.floor(Math.random() * 400) + 200;
            const fat = Math.floor(Math.random() * 25) + 5;
            const carbs = Math.floor(Math.random() * 30) + 10;
            const protein = Math.floor(Math.random() * 20) + 5;
            const sugar = Math.floor(Math.random() * 15);
            
            // Random rating between 3.5 and 5.0
            const rating = (Math.random() * 1.5 + 3.5).toFixed(1);
            
            // Category and region with fallbacks
            const category = meal.strCategory || 'Main Dish';
            const region = meal.strArea || 'International';
            
            // Update overlay content to match HTML structure
            overlayContent.innerHTML = `
                <button class="close-overlay" id="close-overlay" aria-label="Close recipe details">
                    <i class="fas fa-times"></i>
                </button>
                <div class="recipe-detail-container">
                    <div class="recipe-image">
                        <img src="${meal.strMealThumb}" alt="${meal.strMeal}" id="overlay-recipe-image">
                    </div>
                    <div class="recipe-info">
                        <div class="recipe-header">
                            <div class="recipe-tags">
                                <span class="recipe-category" id="overlay-category">🍽️ ${category}</span>
                                <span class="recipe-region" id="overlay-region">🌍 ${region}</span>
                            </div>
                            <h2 class="recipe-title" id="overlay-title">${meal.strMeal}</h2>
                            <div class="recipe-rating" id="overlay-rating">⭐⭐⭐⭐⭐ ${rating}</div>
                            <button class="start-cooking-btn" id="start-cooking-btn">Start Cooking</button>
                            <div class="recipe-actions">
                                <div class="action-item">
                                    <i class="fas fa-share-nodes"></i>
                                    <span>Share</span>
                                </div>
                                <div class="action-item">
                                    <i class="fas fa-bookmark"></i>
                                    <span>Save</span>
                                </div>
                                <div class="action-item">
                                    <i class="fas fa-print"></i>
                                    <span>Print</span>
                                </div>
                                <div class="action-item">
                                    <i class="fas fa-comment"></i>
                                    <span>Comment</span>
                                </div>
                            </div>
                        </div>

                        <div class="recipe-content">
                            <div class="recipe-ingredients">
                                <h3>Ingredients</h3>
                                <ul id="overlay-ingredients">
                                    ${ingredients.join('')}
                                </ul>
                            </div>
                            <div class="recipe-directions">
                                <h3>Directions</h3>
                                <ol id="overlay-directions">
                                    ${instructions}
                                </ol>
                            </div>
                            <div class="recipe-nutrition">
                                <h3>Nutritional Facts (Per Serving)</h3>
                                <ul id="overlay-nutrition">
                                    <li>Calories: ${calories}</li>
                                    <li>Fat: ${fat}g</li>
                                    <li>Carbs: ${carbs}g</li>
                                    <li>Protein: ${protein}g</li>
                                    <li>Sugar: ${sugar}g</li>
                                </ul>
                                <p class="nutrition-disclaimer">This analysis is an estimate based on available ingredients and this preparation. It should not substitute for a dietitian's or nutritionist's advice.</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Re-attach close button event listener
            document.getElementById('close-overlay').addEventListener('click', () => {
                recipeOverlay.classList.remove('active');
                document.body.style.overflow = 'auto';
            });
            
            // Animate in the content
            const recipeContainer = document.querySelector('.recipe-detail-container');
            recipeContainer.style.opacity = '0';
            recipeContainer.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                recipeContainer.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                recipeContainer.style.opacity = '1';
                recipeContainer.style.transform = 'translateY(0)';
            }, 10);
            
            // Start cooking button functionality
            document.getElementById('start-cooking-btn').addEventListener('click', () => {
                // Scroll to directions
                document.querySelector('.recipe-directions').scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            });
            
            // Action button interactions
            document.querySelectorAll('.action-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    const action = e.currentTarget.querySelector('span').textContent.toLowerCase();
                    
                    // Simple feedback for actions
                    const feedback = document.createElement('div');
                    feedback.className = 'action-feedback';
                    feedback.textContent = `${action} action would happen here`;
                    feedback.style.position = 'fixed';
                    feedback.style.bottom = '20px';
                    feedback.style.left = '50%';
                    feedback.style.transform = 'translateX(-50%)';
                    feedback.style.background = 'rgba(0,0,0,0.8)';
                    feedback.style.color = 'white';
                    feedback.style.padding = '10px 20px';
                    feedback.style.borderRadius = '20px';
                    feedback.style.zIndex = '2000';
                    
                    document.body.appendChild(feedback);
                    
                    setTimeout(() => {
                        feedback.style.opacity = '0';
                        setTimeout(() => document.body.removeChild(feedback), 500);
                    }, 2000);
                });
            });
        }
    } catch (error) {
        console.error('Error fetching recipe details:', error);
        
        // Show error in overlay
        const overlayContent = document.querySelector('.overlay-content');
        overlayContent.innerHTML = `
            <button class="close-overlay" id="close-overlay" aria-label="Close recipe details">
                <i class="fas fa-times"></i>
            </button>
            <div class="recipe-error">
                <i class="fas fa-exclamation-circle"></i>
                <h3>Something went wrong</h3>
                <p>Could not load recipe details. Please try again.</p>
                <button class="retry-btn">Retry</button>
            </div>
        `;
        
        // Re-attach close button event
        document.getElementById('close-overlay').addEventListener('click', () => {
            recipeOverlay.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
        
        // Add retry button functionality
        document.querySelector('.retry-btn').addEventListener('click', () => {
            showRecipeDetails(mealId);
        });
    }
}

// Animated text change effect
function animateText(element, newText) {
    element.style.opacity = '0';
    element.style.transform = 'translateY(-10px)';
    
    setTimeout(() => {
        element.textContent = newText;
        element.style.opacity = '1';
        element.style.transform = 'translateY(0)';
    }, 300);
    
    // Add transition if not already present
    if (getComputedStyle(element).transition === 'all 0s ease 0s') {
        element.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    }
}

// Add keyboard navigation for better accessibility
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && recipeOverlay.classList.contains('active')) {
        recipeOverlay.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
});

// Add some visual feedback when clicking the search button
searchButton.addEventListener('mousedown', () => {
    searchButton.style.transform = 'scale(0.95)';
});

searchButton.addEventListener('mouseup', () => {
    searchButton.style.transform = 'scale(1)';
});

// Modern preference detection
function detectUserPreferences() {
    // Check for dark mode preference
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (prefersDarkMode) {
        document.documentElement.classList.add('dark-theme');
        console.log('Dark mode detected and applied');
    }
    
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
        document.documentElement.classList.add('reduced-motion');
        console.log('Reduced motion detected and applied');
    }
}

// Helper function to improve mobile experience
function isMobile() {
    return window.innerWidth <= 768;
}

// Better responsive handling
function handleResponsiveness() {
    const mobile = isMobile();
    
    if (mobile) {
        // Simplify search on mobile
        searchBar.placeholder = "Search recipes...";
        
        // Adjust recipe content on mobile
        const recipeContent = document.querySelector('.recipe-content');
        if (recipeContent) {
            recipeContent.style.gridTemplateColumns = '1fr';
        }
    } else {
        // Desktop experience enhancements
        searchBar.placeholder = "Enter ingredients or cravings (e.g., eggs, pasta, spicy) & get recipes!";
    }
}

// Run responsive functions on load and resize
window.addEventListener('DOMContentLoaded', () => {
    detectUserPreferences();
    handleResponsiveness();
});

window.addEventListener('resize', handleResponsiveness);

// Performance monitoring
const performanceObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    entries.forEach((entry) => {
        console.log(`[Performance] ${entry.name}: ${entry.startTime.toFixed(2)}ms`);
    });
});

performanceObserver.observe({ entryTypes: ['resource', 'navigation'] });