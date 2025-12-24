(function() {
    'use strict';

    /**
     * Prevent click-to-add action and open product creation modal for Vocalmeet Product Widget
     * Using widget title instead of data-widget-type for Elementor 3.34.0 compatibility
     */
    window.addEventListener('elementor:init', function() {
        // Create modal HTML
        const modalHTML = `
            <div id="vm-product-modal" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:999999;display:none;align-items:center;justify-content:center;">
                <div style="background:#fff;padding:30px;border-radius:8px;width:400px;max-width:90%;box-shadow:0 4px 20px rgba(0,0,0,0.3);position:relative;">
                    <span id="vm-modal-close" style="position:absolute;top:10px;right:15px;font-size:28px;cursor:pointer;color:#666;line-height:1;">&times;</span>
                    <h3 style="margin-top:0;margin-bottom:20px;">Create New Product</h3>
                    <form id="vm-product-form">
                        <div style="margin-bottom:15px;">
                            <label for="vm-modal-name" style="display:block;margin-bottom:5px;font-weight:bold;">Product Name</label>
                            <input type="text" id="vm-modal-name" name="name" required style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;box-sizing:border-box;">
                        </div>
                        <div style="margin-bottom:20px;">
                            <label for="vm-modal-price" style="display:block;margin-bottom:5px;font-weight:bold;">Price</label>
                            <input type="number" id="vm-modal-price" name="regular_price" step="0.01" required style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;box-sizing:border-box;">
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

        // Function to open modal
        function openModal() {
            modal.style.display = 'flex';
            document.getElementById('vm-modal-name').focus();
            // Reset form
            form.reset();
            messageDiv.style.display = 'none';
            messageDiv.innerHTML = '';
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
            const recentProducts = JSON.parse(localStorage.getItem('vm_recent_products') || '[]');
            const listContainer = container.querySelector('.vm-recent-products-list');
            
            if (!listContainer) return;
            
            if (recentProducts.length === 0) {
                listContainer.innerHTML = '<p style="color:#999;font-size:12px;margin:0;padding:20px;text-align:center;">No products created yet. Click the widget in the panel to create one.</p>';
                return;
            }
            
            let html = '<div style="display:flex;flex-direction:column;gap:8px;">';
            recentProducts.forEach(product => {
                html += `
                    <div class="vm-product-item" data-product-id="${product.id}" style="padding:10px;border:1px solid #ddd;border-radius:4px;cursor:pointer;transition:background 0.2s;background:#fff;">
                        <div style="font-weight:bold;font-size:13px;margin-bottom:4px;">${product.name}</div>
                        <div style="font-size:11px;color:#666;">ID: ${product.id} | Price: $${product.price || '0.00'}</div>
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
                            elementContainer.settings.setExternalChange('product_id', productId);
                            
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
                                allContainers[0].settings.setExternalChange('product_id', productId);
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
            
            const name = document.getElementById('vm-modal-name').value.trim();
            const price = document.getElementById('vm-modal-price').value.trim();
            const createBtn = document.getElementById('vm-modal-create');

            if (!name || !price) {
                messageDiv.style.display = 'block';
                messageDiv.innerHTML = '<p style="color:red;margin:0;">Please fill in all fields.</p>';
                return;
            }

            createBtn.disabled = true;
            createBtn.textContent = 'Creating...';
            messageDiv.style.display = 'none';
            messageDiv.innerHTML = '';

            // Create product via REST API
            fetch(vmEditorData.root + 'wc/v3/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': vmEditorData.nonce
                },
                body: JSON.stringify({
                    name: name,
                    regular_price: price,
                    type: 'simple',
                    status: 'publish'
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.id) {
                    // Product created successfully
                    closeModal();
                    
                    // Store product in localStorage for later use
                    let recentProducts = JSON.parse(localStorage.getItem('vm_recent_products') || '[]');
                    recentProducts.unshift({
                        id: data.id,
                        name: data.name,
                        price: data.regular_price || data.price,
                        created_at: new Date().toISOString()
                    });
                    // Keep only last 20 products
                    recentProducts = recentProducts.slice(0, 20);
                    localStorage.setItem('vm_recent_products', JSON.stringify(recentProducts));
                    
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
                                            widgetType: 'vocalmeet_product_widget',
                                            settings: {
                                                product_id: data.id.toString()
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
                } else {
                    throw new Error(data.message || 'Failed to create product');
                }
            })
            .catch(error => {
                createBtn.disabled = false;
                createBtn.textContent = 'Create Product';
                messageDiv.style.display = 'block';
                messageDiv.innerHTML = '<p style="color:red;margin:0;">Error: ' + (error.message || 'Failed to create product') + '</p>';
            });
        });
        
        // Function to log recent products
        function logRecentProducts(source) {
            const recentProducts = JSON.parse(localStorage.getItem('vm_recent_products') || '[]');
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
            const recentProducts = JSON.parse(localStorage.getItem('vm_recent_products') || '[]');
            if (recentProducts.length > 0 && widgetId) {
                const productIds = recentProducts.map(product => product.id).join(',');
                
                setTimeout(function() {
                    const container = elementor.getContainer(widgetId);
                    if (container && container.settings) {
                        const currentProductId = container.settings.get('product_id');
                        if (!currentProductId || currentProductId === '') {
                            // Update the setting - this will update both control and trigger re-render
                            container.settings.setExternalChange('product_id', productIds);
                            
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
                    if (model && model.get && model.get('widgetType') === 'vocalmeet_product_widget') {
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
                            if (widgetType === 'vocalmeet_product_widget') {
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
                    model.get('widgetType') === 'vocalmeet_product_widget') {
                    
                    // Widget was successfully added - log recent products
                    logRecentProducts('Widget Added via Drag-and-Drop');
                    
                    // Fill product IDs using the shared function
                    const widgetId = model.get('id');
                    if (widgetId) {
                        fillProductIdsInWidget(widgetId);
                    }
                }
            });
        }
    });

})();

