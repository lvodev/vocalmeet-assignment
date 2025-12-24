(function() {
    'use strict';

    /**
     * Prevent click-to-add action and open product creation modal for Vocalmeet Product Widget
     * Using widget title instead of data-widget-type for Elementor 3.34.0 compatibility
     */
    window.addEventListener('elementor:init', function() {
        const RECENT_PRODUCTS_KEY = 'vm_recent_products';
        const PRODUCT_WIDGET_TYPE = 'vocalmeet_product_widget';
        const PRODUCT_ID_SETTING = 'product_id';
        const MAX_RECENT_PRODUCTS = 20;

        // Create modal HTML
        const modalHTML = `
            <div id="vm-product-modal" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:999999;display:none;align-items:center;justify-content:center;">
                <div style="background:#fff;padding:30px;border-radius:8px;width:400px;max-width:90%;box-shadow:0 4px 20px rgba(0,0,0,0.3);position:relative;">
                    <span id="vm-modal-close" style="position:absolute;top:10px;right:15px;font-size:28px;cursor:pointer;color:#666;line-height:1;">&times;</span>
                    <h3 style="margin-top:0;margin-bottom:20px;">Create New Product</h3>
                    <form id="vm-product-form">
                        <div style="margin-bottom:15px;">
                            <label for="vm-modal-name" style="display:block;margin-bottom:5px;font-weight:bold;">Product Name</label>
                            <input type="text" id="vm-modal-name" name="name" required maxlength="200" minlength="2" pattern=".{2,200}" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;box-sizing:border-box;">
                            <small style="color:#666;font-size:11px;">2-200 characters</small>
                        </div>
                        <div style="margin-bottom:20px;">
                            <label for="vm-modal-price" style="display:block;margin-bottom:5px;font-weight:bold;">Price</label>
                            <input type="number" id="vm-modal-price" name="regular_price" step="0.01" min="0" max="999999.99" required style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;box-sizing:border-box;">
                            <small style="color:#666;font-size:11px;">$0.00 - $999,999.99</small>
                        </div>
                        <div style="text-align:right;">
                            <button type="button" id="vm-modal-cancel" style="margin-right:10px;padding:8px 16px;cursor:pointer;background:#f0f0f0;border:1px solid #ccc;border-radius:4px;">Cancel</button>
                            <button type="submit" id="vm-modal-create" style="background:#0073aa;color:#fff;border:none;padding:8px 16px;cursor:pointer;border-radius:4px;">Create Product</button>
                        </div>
                        <div id="vm-modal-message" style="margin-top:15px;display:none;"></div>
                    </form>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        const modal = document.getElementById('vm-product-modal');
        const closeBtn = document.getElementById('vm-modal-close');
        const cancelBtn = document.getElementById('vm-modal-cancel');
        const form = document.getElementById('vm-product-form');
        const messageDiv = document.getElementById('vm-modal-message');
        const nameInput = document.getElementById('vm-modal-name');
        const priceInput = document.getElementById('vm-modal-price');

        // Rate limiting: track last submission time
        let lastSubmissionTime = 0;
        const MIN_SUBMISSION_INTERVAL = 2000; // 2 seconds between submissions

        function getRecentProducts() {
            return JSON.parse(localStorage.getItem(RECENT_PRODUCTS_KEY) || '[]');
        }

        function setRecentProducts(products) {
            localStorage.setItem(RECENT_PRODUCTS_KEY, JSON.stringify(products));
        }

        function clearRecentProducts() {
            localStorage.removeItem(RECENT_PRODUCTS_KEY);
        }

        // Security: HTML escape function to prevent XSS
        function escapeHtml(text) {
            const map = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#039;'
            };
            return String(text).replace(/[&<>"']/g, function(m) { return map[m]; });
        }

        // Security: Sanitize input - remove dangerous characters and trim
        function sanitizeInput(input) {
            if (typeof input !== 'string') {
                return '';
            }
            // Remove null bytes, control characters, and trim whitespace
            return input
                .replace(/\0/g, '')
                .replace(/[\x00-\x1F\x7F]/g, '')
                .trim();
        }

        // Validation: Validate product name
        function validateProductName(name) {
            const sanitized = sanitizeInput(name);
            
            // Check if empty
            if (!sanitized || sanitized.length === 0) {
                return {
                    valid: false,
                    message: 'Product name is required.'
                };
            }

            // Check length (min 2, max 200 characters)
            if (sanitized.length < 2) {
                return {
                    valid: false,
                    message: 'Product name must be at least 2 characters long.'
                };
            }

            if (sanitized.length > 200) {
                return {
                    valid: false,
                    message: 'Product name must not exceed 200 characters.'
                };
            }

            // Check for potentially dangerous patterns (basic XSS prevention)
            const dangerousPatterns = [
                /<script/i,
                /javascript:/i,
                /on\w+\s*=/i, // onclick, onerror, etc.
                /<iframe/i,
                /<object/i,
                /<embed/i
            ];

            for (let pattern of dangerousPatterns) {
                if (pattern.test(sanitized)) {
                    return {
                        valid: false,
                        message: 'Product name contains invalid characters.'
                    };
                }
            }

            return {
                valid: true,
                value: sanitized
            };
        }

        // Validation: Validate price
        function validatePrice(price) {
            const sanitized = sanitizeInput(price);
            
            // Check if empty
            if (!sanitized || sanitized.length === 0) {
                return {
                    valid: false,
                    message: 'Price is required.'
                };
            }

            // Convert to number
            const priceNum = parseFloat(sanitized);

            // Check if valid number
            if (isNaN(priceNum)) {
                return {
                    valid: false,
                    message: 'Price must be a valid number.'
                };
            }

            // Check if positive
            if (priceNum < 0) {
                return {
                    valid: false,
                    message: 'Price must be a positive number.'
                };
            }

            // Check if too large (prevent overflow attacks)
            if (priceNum > 999999.99) {
                return {
                    valid: false,
                    message: 'Price must not exceed $999,999.99.'
                };
            }

            // Check decimal places (max 2)
            const decimalPlaces = (sanitized.split('.')[1] || '').length;
            if (decimalPlaces > 2) {
                return {
                    valid: false,
                    message: 'Price can have at most 2 decimal places.'
                };
            }

            return {
                valid: true,
                value: priceNum.toFixed(2)
            };
        }

        // Function to show error message (with XSS protection)
        function showError(message) {
            messageDiv.style.display = 'block';
            messageDiv.innerHTML = '<p style="color:red;margin:0;">' + escapeHtml(message) + '</p>';
        }

        // Function to show success message (with XSS protection)
        function showSuccess(message) {
            messageDiv.style.display = 'block';
            messageDiv.innerHTML = '<p style="color:green;margin:0;">' + escapeHtml(message) + '</p>';
        }

        // Function to clear message
        function clearMessage() {
            messageDiv.style.display = 'none';
            messageDiv.innerHTML = '';
        }

        // Add real-time validation feedback
        if (nameInput) {
            nameInput.addEventListener('input', function() {
                const validation = validateProductName(this.value);
                if (this.value.length > 0 && !validation.valid) {
                    this.style.borderColor = '#dc3545';
                } else {
                    this.style.borderColor = '#ddd';
                }
            });
        }
        
        if (priceInput) {
            priceInput.addEventListener('input', function() {
                const validation = validatePrice(this.value);
                if (this.value.length > 0 && !validation.valid) {
                    this.style.borderColor = '#dc3545';
                } else {
                    this.style.borderColor = '#ddd';
                }
            });
        }

        // Function to open modal
        function openModal() {
            modal.style.display = 'flex';
            
            // Reset form
            form.reset();
            clearMessage();
            
            // Reset submit button state
            const createBtn = document.getElementById('vm-modal-create');
            createBtn.disabled = false;
            createBtn.textContent = 'Create Product';
            
            // Reset rate limiting
            lastSubmissionTime = 0;
            
            // Reset input border colors
            if (nameInput) nameInput.style.borderColor = '#ddd';
            if (priceInput) priceInput.style.borderColor = '#ddd';
            
            // Focus on name input
            if (nameInput) nameInput.focus();
        }

        // Function to close modal
        function closeModal() {
            modal.style.display = 'none';
        }

        // Close modal events
        closeBtn.onclick = closeModal;
        cancelBtn.onclick = closeModal;
        window.addEventListener('click', function(event) {
            if (event.target === modal) {
                closeModal();
            }
        });

        // Function to render recent products list
        function renderProductList(container) {
            const recentProducts = getRecentProducts();
            const listContainer = container.querySelector('.vm-recent-products-list');
            
            if (!listContainer) return;
            
            if (recentProducts.length === 0) {
                listContainer.innerHTML = '<p style="color:#999;font-size:12px;margin:0;padding:20px;text-align:center;">No products created yet. Click the widget in the panel to create one.</p>';
                return;
            }
            
            let html = '<div style="display:flex;flex-direction:column;gap:8px;">';
            recentProducts.forEach(product => {
                // Sanitize product data to prevent XSS
                const productId = parseInt(product.id) || 0;
                const productName = escapeHtml(String(product.name || ''));
                const productPrice = escapeHtml(String(product.price || '0.00'));
                
                html += `
                    <div class="vm-product-item" data-product-id="${productId}" style="padding:10px;border:1px solid #ddd;border-radius:4px;cursor:pointer;transition:background 0.2s;background:#fff;">
                        <div style="font-weight:bold;font-size:13px;margin-bottom:4px;">${productName}</div>
                        <div style="font-size:11px;color:#666;">ID: ${productId} | Price: $${productPrice}</div>
                    </div>
                `;
            });
            html += '</div>';
            listContainer.innerHTML = html;
            
            // Add click handlers to product items
            listContainer.querySelectorAll('.vm-product-item').forEach(item => {
                item.addEventListener('click', function() {
                    const productId = this.getAttribute('data-product-id');
                    let widgetId = container.getAttribute('data-widget-id');
                    
                    // If no widget ID in attribute, try to find it from the DOM
                    if (!widgetId) {
                        const widgetElement = container.closest('[data-id]');
                        if (widgetElement) {
                            widgetId = widgetElement.getAttribute('data-id');
                        }
                    }
                    
                    if (productId && widgetId) {
                        // Find the widget container in Elementor
                        const elementContainer = elementor.getContainer(widgetId);
                        if (elementContainer) {
                            // Update the product_id setting
                            elementContainer.settings.setExternalChange(PRODUCT_ID_SETTING, productId);
                            
                            // Show success feedback
                            this.style.background = '#d4edda';
                            setTimeout(() => {
                                this.style.background = '#fff';
                            }, 500);
                        } else {
                            // Fallback: try to find by searching all containers
                            const allContainers = elementor.getContainer('document').findViewRecursive(function(view) {
                                return view.model && view.model.get('id') === widgetId;
                            });
                            if (allContainers && allContainers.length > 0) {
                                allContainers[0].settings.setExternalChange(PRODUCT_ID_SETTING, productId);
                                this.style.background = '#d4edda';
                                setTimeout(() => {
                                    this.style.background = '#fff';
                                }, 500);
                            }
                        }
                    }
                });
                
                // Hover effect
                item.addEventListener('mouseenter', function() {
                    this.style.background = '#f0f8ff';
                });
                item.addEventListener('mouseleave', function() {
                    this.style.background = '#fff';
                });
            });
        }
        
        // Render product lists for existing widgets
        function renderAllProductLists() {
            document.querySelectorAll('.vm-product-selector').forEach(container => {
                renderProductList(container);
            });
        }

        // Handle form submission
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const nameInput = document.getElementById('vm-modal-name');
            const priceInput = document.getElementById('vm-modal-price');
            const createBtn = document.getElementById('vm-modal-create');

            // Rate limiting: prevent rapid submissions
            const currentTime = Date.now();
            if (lastSubmissionTime > 0 && (currentTime - lastSubmissionTime) < MIN_SUBMISSION_INTERVAL) {
                showError('Please wait a moment before submitting again.');
                return;
            }

            // Validate product name
            const nameValidation = validateProductName(nameInput.value);
            if (!nameValidation.valid) {
                showError(nameValidation.message);
                nameInput.focus();
                return;
            }

            // Validate price
            const priceValidation = validatePrice(priceInput.value);
            if (!priceValidation.valid) {
                showError(priceValidation.message);
                priceInput.focus();
                return;
            }

            // All validations passed, proceed with submission
            const sanitizedName = nameValidation.value;
            const sanitizedPrice = priceValidation.value;

            // Disable button and show loading state
            createBtn.disabled = true;
            createBtn.textContent = 'Creating...';
            clearMessage();

            // Update last submission time
            lastSubmissionTime = currentTime;

            // Create product via REST API
            fetch(vmEditorData.root + 'wc/v3/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': vmEditorData.nonce
                },
                body: JSON.stringify({
                    name: sanitizedName,
                    regular_price: sanitizedPrice,
                    type: 'simple',
                    status: 'publish'
                })
            })
            .then(response => {
                // Check if response is ok (status 200-299)
                if (!response.ok) {
                    // Try to parse error response
                    return response.json().then(errorData => {
                        throw new Error(errorData.message || `Server error: ${response.status} ${response.statusText}`);
                    }).catch(() => {
                        // If JSON parsing fails, throw generic error
                        throw new Error(`Server error: ${response.status} ${response.statusText}`);
                    });
                }
                return response.json();
            })
            .then(data => {
                // Additional validation: ensure we have a valid product ID
                if (!data || !data.id) {
                    throw new Error(data.message || 'Invalid response from server. Product may not have been created.');
                }
                
                // Product created successfully
                // Reset submit button before closing modal
                createBtn.disabled = false;
                createBtn.textContent = 'Create Product';
                closeModal();
                
                // Sanitize and store product in localStorage for later use
                let recentProducts = getRecentProducts();
                recentProducts.unshift({
                    id: parseInt(data.id) || 0, // Ensure ID is a number
                    name: sanitizeInput(String(data.name || '')), // Sanitize name
                    price: sanitizeInput(String(data.regular_price || data.price || '0.00')), // Sanitize price
                    created_at: new Date().toISOString()
                });
                // Keep only last 20 products
                recentProducts = recentProducts.slice(0, MAX_RECENT_PRODUCTS);
                setRecentProducts(recentProducts);
                    
                    // Refresh product lists in all widgets
                    renderAllProductLists();
                    
                    // Store product ID for widget addition
                    window.vmCreatedProductId = data.id;
                    
                    // Add widget to the page with the product ID
                    if (typeof elementor !== 'undefined') {
                        try {
                            // Get the document container
                            const documentContainer = elementor.getContainer('document');
                            
                            if (documentContainer) {
                                // Find a suitable container to add the widget to
                                let targetContainer = null;
                                
                                // Try to get selected container first
                                if (elementor.selection && elementor.selection.getFirst) {
                                    const selected = elementor.selection.getFirst();
                                    if (selected && selected.view && selected.view.isCollection) {
                                        targetContainer = selected;
                                    }
                                }
                                
                                // If no suitable container, find first column or section
                                if (!targetContainer) {
                                    const documentView = documentContainer.view;
                                    if (documentView && documentView.collection) {
                                        const sections = documentView.collection.models;
                                        if (sections && sections.length > 0) {
                                            const firstSection = sections[0];
                                            if (firstSection.view && firstSection.view.collection) {
                                                const columns = firstSection.view.collection.models;
                                                if (columns && columns.length > 0) {
                                                    targetContainer = columns[0];
                                                } else {
                                                    targetContainer = firstSection;
                                                }
                                            }
                                        }
                                    }
                                }
                                
                                // If still no container, use document
                                if (!targetContainer) {
                                    targetContainer = documentContainer;
                                }
                                
                                // Add the widget using Elementor's command
                                if (targetContainer && targetContainer.commands) {
                                    targetContainer.commands.run('document/elements/create', {
                                        model: {
                                            elType: 'widget',
                                            widgetType: PRODUCT_WIDGET_TYPE,
                                            settings: {
                                                [PRODUCT_ID_SETTING]: data.id.toString()
                                            }
                                        },
                                        container: targetContainer
                                    });
                                    
                                    // Show success message after a short delay
                                    setTimeout(() => {
                                        if (elementor.notifications && elementor.notifications.showToast) {
                                            elementor.notifications.showToast({
                                                message: 'Product created! Widget added with Product ID: ' + data.id
                                            });
                                        } else {
                                            alert('Product created successfully!\nWidget added with Product ID: ' + data.id);
                                        }
                                    }, 300);
                                } else {
                                    alert('Product created successfully! Product ID: ' + data.id + '\nPlease add the Vocalmeet Product widget manually and set the Product ID.');
                                }
                            } else {
                                alert('Product created successfully! Product ID: ' + data.id);
                            }
                        } catch (error) {
                            console.error('Error adding widget:', error);
                            alert('Product created successfully! Product ID: ' + data.id + '\nPlease add the Vocalmeet Product widget manually and set the Product ID.');
                        }
                    } else {
                        alert('Product created successfully! Product ID: ' + data.id);
                    }
            })
            .catch(error => {
                createBtn.disabled = false;
                createBtn.textContent = 'Create Product';
                // Sanitize error message to prevent XSS
                const errorMessage = error.message || 'Failed to create product. Please try again.';
                showError('Error: ' + errorMessage);
                // Reset rate limiting on error so user can retry
                lastSubmissionTime = 0;
            });
        });
        
        // Function to log recent products
        function logRecentProducts(source) {
            const recentProducts = getRecentProducts();
            console.log('=== Vocalmeet Product Widget Detected ===');
            console.log('Detection Source:', source);
            console.log('Recent Products from Local Storage:', recentProducts);
            console.log('Number of products:', recentProducts.length);
            console.log('==========================================');
        }
        
        // Initial render
        setTimeout(renderAllProductLists, 500);
        
        // Function to fill product IDs in widget
        function fillProductIdsInWidget(widgetId) {
            const recentProducts = getRecentProducts();
            if (recentProducts.length > 0 && widgetId) {
                const productIds = recentProducts.map(product => product.id).join(',');
                
                setTimeout(function() {
                    const container = elementor.getContainer(widgetId);
                    if (container && container.settings) {
                        const currentProductId = container.settings.get(PRODUCT_ID_SETTING);
                        if (!currentProductId || currentProductId === '') {
                            // Update the setting - this will update both control and trigger re-render
                            container.settings.setExternalChange(PRODUCT_ID_SETTING, productIds);
                            
                            // Force a render update
                            if (container.render) {
                                container.render();
                            }
                            
                            console.log('Product IDs filled and widget updated:', productIds);
                        }
                    }
                }, 200);
            }
        }
        
        // Re-render when widgets are added or updated
        if (typeof elementor !== 'undefined') {
            // Listen for widget additions
            elementor.hooks.addAction('panel/widgets/widget-rendered', function() {
                setTimeout(renderAllProductLists, 100);
            });
            
            // Listen for document changes (widget drag-and-drop) - catch it immediately
            if (elementor.hooks && elementor.hooks.addAction) {
                elementor.hooks.addAction('document/elements/create', function(model, container) {
                    // Check if it's our widget
                    if (model && model.get && model.get('widgetType') === PRODUCT_WIDGET_TYPE) {
                        const widgetId = model.get('id');
                        if (widgetId) {
                            // Fill product IDs immediately when widget is created
                            fillProductIdsInWidget(widgetId);
                        }
                        setTimeout(renderAllProductLists, 100);
                    }
                });
            }
        }
        
        // Use MutationObserver to catch dynamically added widgets
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === 1) {
                        // Check for our product selector
                        const productSelector = node.querySelector && node.querySelector('.vm-product-selector');
                        if (productSelector) {
                            renderProductList(productSelector);
                        }
                        
                        // Check if node itself is the selector
                        if (node.classList && node.classList.contains('vm-product-selector')) {
                            renderProductList(node);
                        }
                        
                        // Check for elementor-widget with our widget type
                        if (node.classList && node.classList.contains('elementor-widget')) {
                            const widgetType = node.getAttribute('data-widget-type') || 
                                             (node.querySelector('[data-widget-type]') && node.querySelector('[data-widget-type]').getAttribute('data-widget-type'));
                            if (widgetType === PRODUCT_WIDGET_TYPE) {
                                // Also check for product selector inside
                                const selector = node.querySelector('.vm-product-selector');
                                if (selector) {
                                    renderProductList(selector);
                                }
                            }
                        }
                        
                        // Check for elementor-element with data-id (Elementor widget wrapper)
                        if (node.hasAttribute && node.hasAttribute('data-id')) {
                            // Check if it contains our widget
                            const hasProductSelector = node.querySelector && node.querySelector('.vm-product-selector');
                            if (hasProductSelector) {
                                renderProductList(hasProductSelector);
                            }
                        }
                    }
                });
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Block click-to-add action and open modal instead
        document.addEventListener('click', function(event) {
            const widgetButton = event.target.closest('.elementor-element');
            if (widgetButton) {
                const titleElement = widgetButton.querySelector('.title');
                
                // Check if the widget title matches "Vocalmeet Product"
                if (titleElement && titleElement.innerText.trim() === 'Vocalmeet Product') {
                    event.preventDefault();
                    event.stopPropagation();
                    event.stopImmediatePropagation();
                    
                    // Open modal instead of adding widget
                    openModal();
                    return false;
                }
            }
        }, true); // Capture phase to intercept before Elementor handles it


        // Listen for Vocalmeet Product widget when it's added to the editor
        if (typeof elementor !== 'undefined' && elementor.channels && elementor.channels.editor) {
            elementor.channels.editor.on('section:activated', function (sectionName, editor) {
                const model = editor.getOption('model');
        
                if (!model) return;
        
                if (model.get('elType') === 'widget' &&
                    model.get('widgetType') === PRODUCT_WIDGET_TYPE) {
                    
                    // Widget was successfully added - log recent products
                    logRecentProducts('Widget Added via Drag-and-Drop');
                    
                    // Fill product IDs using the shared function
                    const widgetId = model.get('id');
                    if (widgetId) {
                        fillProductIdsInWidget(widgetId);
                        // Clear the product ID from the localStorage
                        clearRecentProducts();
                    }
                }
            });
        }
    });

})();
