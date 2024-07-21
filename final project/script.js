let cart = JSON.parse(localStorage.getItem('cart')) || [];
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    if (path.endsWith('store.html') || path === '/') {
        loadCategories();
        loadPromotedCategories();
    } else if (path.endsWith('product.html')) {
        const params = new URLSearchParams(window.location.search);
        const productId = params.get('id');
        if (productId) {
            loadProductDetails(productId);
        }
    } else if (path.endsWith('cart.html')) {
        viewCart();
    } else if (path.endsWith('favorites.html')) {
        viewFavorites();
    }
    updateCartCount();
    updateFavoritesCount();

    document.getElementById('search').addEventListener('input', searchProducts);

    // ניהול ה-submenu בכל הדפים
    const headerButton = document.querySelector('.header-button');
    const submenu = document.querySelector('.submenu');

    headerButton.addEventListener('click', toggleSubmenu);

    // Loading categories on all pages for submenu
    loadCategories();
});

async function loadCategories() {
    const response = await fetch('https://dummyjson.com/products/category-list');
    const data = await response.json();
    const categories = data.map(category => `
        <li>
            <img src="images/${category}.png" alt="${category}">
            <a href="#" onclick="loadCategory('${category}')">${category}</a>
        </li>`).join('');
    document.getElementById('categories').innerHTML = categories;
    document.getElementById('categories-row').innerHTML = categories;

    // Also populate the submenu categories
    document.querySelector('.submenu').innerHTML = categories;
}

function toggleSubmenu() {
    const submenu = document.querySelector('.submenu');
    const arrow = document.querySelector('.header-button .arrow');
    if (submenu.style.display === 'flex') {
        submenu.style.display = 'none';
        arrow.style.display = 'none';
    } else {
        submenu.style.display = 'flex';
        arrow.style.display = 'inline';
    }
}

async function loadPromotedCategories() {
    const response = await fetch('https://dummyjson.com/products');
    const data = await response.json();
    const categoriesWithProducts = {};

    data.products.forEach(product => {
        if (!categoriesWithProducts[product.category]) {
            categoriesWithProducts[product.category] = [];
        }
        categoriesWithProducts[product.category].push(product);
    });

    for (const category in categoriesWithProducts) {
        if (categoriesWithProducts[category].length > 0) {
            const products = categoriesWithProducts[category].slice(0, 4).map(product => renderProduct(product)).join('');
            const categorySection = `
                <div class="promoted-category">
                    <h2>${category.charAt(0).toUpperCase() + category.slice(1)}</h2>
                    <div>${products}</div>
                </div>
            `;
            document.getElementById('promoted-categories').innerHTML += categorySection;
        }
    }
}

async function loadCategory(category) {
    const response = await fetch(`https://dummyjson.com/products/category/${category}`);
    const data = await response.json();
    const products = data.products.map(product => renderProduct(product)).join('');
    document.getElementById('main-content').innerHTML = `
        <h2>${category.charAt(0).toUpperCase() + category.slice(1)}</h2>
        <div class="category-products">${products}</div>
    `;
}

async function searchProducts() {
    const query = document.getElementById('search').value;
    if (query.length < 1) {
        loadPromotedCategories();
        return;
    }
    const response = await fetch(`https://dummyjson.com/products/search?q=${query}`);
    const data = await response.json();
    const products = data.products.map(product => renderProduct(product)).join('');
    document.getElementById('main-content').innerHTML = `
        <h2>Search Results for "${query}"</h2>
        <div class="search-results">${products}</div>
    `;
}

function renderProduct(product) {
    const isFavorite = favorites.some(fav => fav.id === product.id);
    return `
        <div class="product">
            <img src="${product.thumbnail}" alt="${product.title}">
            <h2>${product.title}</h2>
            <p>$${product.price}</p>
            <div class="button-container">
                <button class="details-button" onclick="location.href='product.html?id=${product.id}'">Details</button>
                <button class="add-to-cart-button" onclick="addToCart(${product.id}, '${product.title}', '${product.thumbnail}', ${product.price}, ${product.stock})">Add to Cart</button>
                <button class="favorite-button ${isFavorite ? 'active' : ''}" onclick="toggleFavorite(${product.id}, '${product.title}', '${product.thumbnail}', ${product.price})">
                    ${isFavorite ? '❤️' : '🤍'}
                </button>
            </div>
        </div>
    `;
}

async function loadProductDetails(id) {
    const response = await fetch(`https://dummyjson.com/products/${id}`);
    const product = await response.json();

    const thumbnails = product.images.map((img, index) => `
        <img src="${img}" alt="${product.title} - Image ${index + 1}" 
             class="thumbnail" onclick="changeMainImage(${index})">
    `).join('');

    document.getElementById('main-content').innerHTML = `
        <div class="product-detail">
            <div class="image-carousel">
                <img src="${product.images[0]}" alt="${product.title}" id="main-image" class="main-image">
                <div class="thumbnails">
                    ${thumbnails}
                </div>
            </div>
            <div class="product-info">
                <h2>${product.title}</h2>
                <p>${product.description.replace(/(.{60})/g, '$1\n')}</p>
                <p>$${product.price}</p>
                <p>In stock: ${product.stock}</p>
                <div class="quantityProduct">
                    <button onclick="decreaseQuantity()">-</button>
                    <input type="number" id="quantity" value="1" min="1" max="${product.stock}">
                    <button onclick="increaseQuantity(${product.stock})">+</button>
                </div>
                <button class="add-to-cart-button" onclick="addToCart(${product.id}, '${product.title}', '${product.thumbnail}', ${product.price}, ${product.stock})">Add to Cart</button>
            </div>
        </div>
        <div class="reviews">
            <h3>Reviews</h3>
            <ul>
                ${product.reviews.map(review => `
                    <li>
                        <p><strong>Rating:</strong> <span class="star-rating">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</span></p>
                        <p><strong>Comment:</strong> ${review.comment}</p>
                        <p><strong>Date:</strong> ${new Date(review.date).toLocaleDateString()}</p>
                        <p><strong>Reviewer:</strong> ${review.reviewerName}</p>
                    </li>
                `).join('')}
            </ul>
        </div>
    `;
}

function changeMainImage(index) {
    const mainImage = document.getElementById('main-image');
    const thumbnails = document.querySelectorAll('.thumbnail');
    mainImage.src = thumbnails[index].src;
    thumbnails.forEach((thumb, i) => {
        thumb.classList.toggle('active', i === index);
    });
}

function addToCart(id, title, thumbnail, price, stock) {
    const quantityInput = document.getElementById('quantity');
    let quantity = quantityInput ? parseInt(quantityInput.value, 10) : 1;

    if (quantity > stock) {
        alert(`Only ${stock} items available in stock.`);
        quantity = stock;
        if (quantityInput) quantityInput.value = quantity;
    }

    const existingProduct = cart.find(item => item.id === id);

    if (existingProduct) {
        if (existingProduct.quantity + quantity > stock) {
            alert(`Only ${stock} items available in stock.`);
            quantity = stock - existingProduct.quantity;
            if (quantityInput) quantityInput.value = quantity;
        }
        existingProduct.quantity += quantity;
    } else {
        cart.push({ id, title, thumbnail, price, quantity, stock });
    }

    localStorage.setItem('cart', JSON.stringify(cart)); // Save cart to localStorage
    updateCartCount(); // Update cart count when adding a product to the cart

    const userChoice = confirm('Click "OK" to view your cart or "Cancel" to continue shopping.');
    
    if (userChoice) {
        viewCart();
    }
}

function updateCartCount() {
    const cartCountElements = document.querySelectorAll('.cart-count');
    const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCountElements.forEach(element => {
        element.textContent = totalQuantity;
    });
}

function increaseQuantity(stock) {
    const quantityInput = document.getElementById('quantity');
    let quantity = parseInt(quantityInput.value, 10);
    if (quantity < stock) {
        quantity++;
        quantityInput.value = quantity;
    }
}

function decreaseQuantity() {
    const quantityInput = document.getElementById('quantity');
    let quantity = parseInt(quantityInput.value, 10);
    if (quantity > 1) {
        quantity--;
        quantityInput.value = quantity;
    }
}

function viewCart() {
    if (cart.length === 0) {
        document.getElementById('main-content').innerHTML = `
            <div class="cart-container">
                <h2 class="cart-title">Shopping Cart</h2>
                <div class="empty-cart-message">
                    <img src="x_empty-cart.png" alt="Empty Cart">
                </div>
            </div>
        `;
    } else {
        document.getElementById('main-content').innerHTML = `
            <div class="cart-container">
                <h2 class="cart-title">Shopping Cart</h2>
                <ul class="cart-list">
                    ${cart.map(item => `
                        <li class="cart-item">
                            <img src="${item.thumbnail}" alt="${item.title}">
                            <div class="cart-item-details">
                                <h3>${item.title}</h3>
                                <p>$${item.price}</p>
                                <div class="cart-item-quantity">
                                    <button onclick="updateCartQuantity(${item.id}, -1, ${item.stock})">-</button>
                                    <input type="number" id="quantity-${item.id}" value="${item.quantity}" min="1" max="${item.stock}" onchange="updateCartQuantity(${item.id}, this.value, ${item.stock})">
                                    <button onclick="updateCartQuantity(${item.id}, 1, ${item.stock})">+</button>
                                </div>
                            </div>
                            <button class="cart-item-remove" onclick="removeFromCart(${item.id})">
                                <svg class="trash-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                                    <path d="M3 6v18h18v-18h-18zm5 14c0 .552-.448 1-1 1s-1-.448-1-1v-10c0-.552.448-1 1-1s1 .448 1 1v10zm5 0c0 .552-.448 1-1 1s-1-.448-1-1v-10c0-.552.448-1 1-1s1 .448 1 1v10zm5 0c0 .552-.448 1-1 1s-1-.448-1-1v-10c0-.552.448-1 1-1s1 .448 1 1v10zm4-18v2h-20v-2h5.711c.9 0 1.631-1.099 1.631-2h5.315c0 .901.73 2 1.631 2h5.712z"/>
                                </svg>
                            </button>
                        </li>
                    `).join('')}
                </ul>
                <div class="cart-summary">
                    <p class="cart-total">Total: $${calculateCartTotal()}</p>
                    <button class="checkout-button" onclick="checkout()">Checkout</button>
                </div>
            </div>
        `;
    }
}

function updateCartQuantity(id, change, stock) {
    const product = cart.find(item => item.id === id);
    if (product) {
        let newQuantity = product.quantity + change;
        if (typeof change === 'string') {
            newQuantity = parseInt(change, 10);
        }

        if (newQuantity > stock) {
            alert(`Only ${stock} items available in stock.`);
            newQuantity = stock;
        } else if (newQuantity < 1) {
            newQuantity = 1;
        }

        product.quantity = newQuantity;
        localStorage.setItem('cart', JSON.stringify(cart)); // Save updated cart to localStorage
        viewCart();
    }
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    localStorage.setItem('cart', JSON.stringify(cart)); // Save updated cart to localStorage
    viewCart();
    updateCartCount(); // Update cart count after removing an item from the cart
}

function calculateCartTotal() {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0).toFixed(2);
}

function checkout() {
    document.getElementById('main-content').innerHTML = `
        <div class="checkout-container">
            <h2>Checkout</h2>
            <form onsubmit="submitOrder(event)">
                <div class="form-group">
                    <label for="name">Full Name:</label>
                    <input type="text" id="name" required>
                </div>
                <div class="form-group">
                    <label for="email">Email:</label>
                    <input type="email" id="email" required>
                </div>
                <div class="form-group">
                    <label for="phone">Phone Number:</label>
                    <input type="tel" id="phone" required>
                </div>
                <div class="form-group">
                    <label for="address">Shipping Address:</label>
                    <textarea id="address" required></textarea>
                </div>
                <div class="form-group">
                    <label for="card">Credit Card Number:</label>
                    <input type="text" id="card" required>
                </div>
                <div class="form-group">
                    <label for="expiry">Expiry Date:</label>
                    <input type="text" id="expiry" placeholder="MM/YY" required>
                </div>
                <div class="form-group">
                    <label for="cvv">CVV:</label>
                    <input type="text" id="cvv" required>
                </div>
                <div class="form-group">
                    <button type="submit" class="checkout-button">Place Order</button>
                </div>
            </form>
        </div>
    `;

    // ensure only numbers are inputted
    document.getElementById('phone').addEventListener('input', function (event) {
        this.value = this.value.replace(/[^0-9]/g, '').slice(0, 10);
    });

    document.getElementById('card').addEventListener('input', function (event) {
        this.value = this.value.replace(/[^0-9]/g, '');
    });

    document.getElementById('expiry').addEventListener('input', function (event) {
        this.value = this.value.replace(/[^0-9]/g, '').slice(0, 4);
    });

    document.getElementById('cvv').addEventListener('input', function (event) {
        this.value = this.value.replace(/[^0-9]/g, '').slice(0, 3);
    });
}


function submitOrder(event) {
    event.preventDefault();
    document.getElementById('main-content').innerHTML = `
        <div class="order-confirmation">
            <h2>Your order is on the way!</h2>
            <div class="confirmation-content">
                <img src="x_fast-delivery.png" alt="Fast Delivery" class="delivery-image">
                <button onclick="returnToHome()" class="return-home-button">Return to Home Page</button>
            </div>
        </div>
    `;
    cart = [];
    localStorage.setItem('cart', JSON.stringify(cart)); // Reset cart in localStorage after checkout
    updateCartCount(); // Reset cart count after checkout
}

function returnToHome() {
    location.href = 'store.html';
}

function toggleFavorite(id, title, thumbnail, price) {
    const index = favorites.findIndex(fav => fav.id === id);
    if (index === -1) {
        favorites.push({ id, title, thumbnail, price });
    } else {
        favorites.splice(index, 1);
    }
    localStorage.setItem('favorites', JSON.stringify(favorites));
    updateFavoritesCount();
    if (window.location.pathname.endsWith('favorites.html')) {
        viewFavorites();
    } else {
        const button = event.target;
        button.classList.toggle('active');
        button.textContent = button.classList.contains('active') ? '❤️' : '🤍';
    }
}

function updateFavoritesCount() {
    const favoritesCountElements = document.querySelectorAll('.favorites-count');
    favoritesCountElements.forEach(element => {
        element.textContent = favorites.length;
    });
}

function viewFavorites() {
    const mainContent = document.getElementById('main-content');
    
    if (favorites.length === 0) {
        mainContent.innerHTML = `
            <div class="favorites-container">
                <h2 class="favorites-title">Your Favorites</h2>
                <p class="no-favorites-message">You haven't added any favorites yet.</p>
            </div>
        `;
    } else {
        mainContent.innerHTML = `
            <div class="favorites-container">
                <h2 class="favorites-title">Your Favorites</h2>
                <ul class="favorites-list">
                    ${favorites.map(item => `
                        <li class="favorite-item">
                            <img src="${item.thumbnail}" alt="${item.title}">
                            <div class="favorite-item-details">
                                <h3>${item.title}</h3>
                                <p>$${item.price}</p>
                            </div>
                            <div class="favorite-item-actions">
                                <button class="add-to-cart-button" onclick="addToCart(${item.id}, '${item.title}', '${item.thumbnail}', ${item.price}, 1)">Add to Cart</button>
                                <button class="remove-favorite-button" onclick="toggleFavorite(${item.id}, '${item.title}', '${item.thumbnail}', ${item.price})">Remove</button>
                            </div>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.querySelector('.hamburger');
    const hamburgerMenu = document.querySelector('.hamburger-menu');

    hamburger.addEventListener('click', () => {
        hamburgerMenu.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
        if (!hamburger.contains(e.target) && !hamburgerMenu.contains(e.target)) {
            hamburgerMenu.classList.remove('open');
        }
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const icons = document.querySelectorAll('.icon-container img');

    icons.forEach(icon => {
        icon.addEventListener('click', () => {
            // Remove 'icon-active' class from all icons
            icons.forEach(icon => icon.parentElement.classList.remove('icon-active'));

            // Add 'icon-active' class to the clicked icon's parent
            icon.parentElement.classList.add('icon-active');
        });
    });
});