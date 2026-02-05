/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id: { type: integer }
 *         username: { type: string }
 *         email: { type: string }
 *         name: { type: string }
 *         role: { type: string, enum: [admin, editor, author, subscriber] }
 *     Category:
 *       type: object
 *       properties:
 *         id: { type: integer }
 *         name: { type: string }
 *         slug: { type: string }
 *         description: { type: string }
 *         parent_id: { type: integer }
 *     Post:
 *       type: object
 *       properties:
 *         id: { type: integer }
 *         author_id: { type: integer }
 *         title: { type: string }
 *         slug: { type: string }
 *         content: { type: string }
 *         excerpt: { type: string }
 *         status: { type: string, enum: [published, draft, archived] }
 *     Product:
 *       type: object
 *       properties:
 *         id: { type: integer }
 *         name: { type: string }
 *         slug: { type: string }
 *         description: { type: string }
 *         sku: { type: string }
 *         price: { type: number }
 *         sale_price: { type: number }
 *         stock_quantity: { type: integer }
 *         stock_status: { type: string, enum: [in_stock, out_of_stock, backorder] }
 *         image_url: { type: string }
 *         category_id: { type: integer }
 *     Order:
 *       type: object
 *       properties:
 *         id: { type: integer }
 *         user_id: { type: integer }
 *         order_number: { type: string }
 *         status: { type: string, enum: [pending, processing, shipped, completed, cancelled, returned] }
 *         sub_total: { type: number }
 *         shipping_fee: { type: number }
 *         tax_amount: { type: number }
 *         total_amount: { type: number }
 *         coupon_code: { type: string }
 *         discount_amount: { type: number }
 *         shipping_name: { type: string }
 *         shipping_address: { type: string }
 *         shipping_phone: { type: string }
 *         shipping_email: { type: string }
 *         note: { type: string }
 *         payment_method_id: { type: string }
 *         shipping_partner_id: { type: integer }
 *         tracking_number: { type: string }
 *         cancelled_at: { type: string, format: date-time }
 *         completed_at: { type: string, format: date-time }
 *     Coupon:
 *       type: object
 *       properties:
 *         id: { type: integer }
 *         code: { type: string }
 *         discount_type: { type: string, enum: [fixed_cart, percent, free_ship] }
 *         amount: { type: number }
 *         max_discount: { type: number }
 *         min_spend: { type: number }
 *         usage_limit: { type: integer }
 *         usage_count: { type: integer }
 *         expiry_date: { type: string, format: date-time }
 *         isActive: { type: boolean }
 *         is_show_banner: { type: boolean }
 *     Comment:
 *       type: object
 *       properties:
 *         id: { type: integer }
 *         post_id: { type: integer }
 *         user_id: { type: integer }
 *         author_name: { type: string }
 *         author_email: { type: string }
 *         content: { type: string }
 *         is_approved: { type: boolean }
 *         parent_id: { type: integer }
 *         created_at: { type: string, format: date-time }
 *     PostMeta:
 *       type: object
 *       properties:
 *         id: { type: integer }
 *         post_id: { type: integer }
 *         meta_key: { type: string }
 *         meta_value: { type: string }
 *     ProductImage:
 *       type: object
 *       properties:
 *         id: { type: integer }
 *         product_id: { type: integer }
 *         image_url: { type: string }
 *         display_order: { type: integer }
 *     ProductVariant:
 *       type: object
 *       properties:
 *         id: { type: integer }
 *         product_id: { type: integer }
 *         sku: { type: string }
 *         price: { type: number }
 *         stock_quantity: { type: integer }
 *         image_url: { type: string }
 *     VariantOption:
 *       type: object
 *       properties:
 *         id: { type: integer }
 *         variant_id: { type: integer }
 *         attribute_name: { type: string }
 *         attribute_value: { type: string }
 *     OrderItem:
 *       type: object
 *       properties:
 *         id: { type: integer }
 *         order_id: { type: integer }
 *         product_id: { type: integer }
 *         product_name: { type: string }
 *         variant_id: { type: integer }
 *         variant_name: { type: string }
 *         sku: { type: string }
 *         thumbnail_url: { type: string }
 *         quantity: { type: integer }
 *         unit_price: { type: number }
 *         subtotal: { type: number }
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     DashboardStat:
 *       type: object
 *       properties:
 *         name: { type: string, example: "T1" }
 *         revenue: { type: number, example: 12345.67 }
 *         orders: { type: integer, example: 100 }
 *         customers: { type: integer, example: 50 }
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     PaymentMethodStat:
 *       type: object
 *       properties:
 *         name: { type: string, example: "Credit Card" }
 *         value: { type: number, example: 45.75 } # Percentage
 *         amount: { type: number, example: 12345.67 } # Total currency amount
 */

/**
 * @swagger
 * /api/dashboard/stats:
 *   get:
 *     summary: Get dashboard statistics (revenue, orders, customers) over a period
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month, year]
 *         required: true
 *         description: The period for which to retrieve statistics (week, month, or year).
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DashboardStat'
 *       400:
 *         description: Invalid period provided.
 *       500:
 *         description: Server error.
 */

/**
 * @swagger
 * /api/dashboard/payment-methods:
 *   get:
 *     summary: Get payment method statistics (percentage and total amount)
 *     responses:
 *       200:
 *         description: Payment method statistics retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PaymentMethodStat'
 *       500:
 *         description: Server error.
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *   post:
 *     summary: Create a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: User created
 */

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: User login
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Login successful
 */

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Get all categories
 *     responses:
 *       200:
 *         description: List of categories
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Category'
 *   post:
 *     summary: Create a new category
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Category'
 *     responses:
 *       201:
 *         description: Category created
 */

/**
 * @swagger
 * /api/posts:
 *   get:
 *     summary: Get all posts
 *     responses:
 *       200:
 *         description: List of posts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Post'
 *   post:
 *     summary: Create a new post
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Post'
 *     responses:
 *       201:
 *         description: Post created
 */

/**
 * @swagger
 * /api/upload:
 *   post:
 *     summary: Upload an image
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Upload successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 url: { type: string }
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get all products
 *     parameters:
 *       - in: query
 *         name: promotion_type
 *         schema:
 *           type: string
 *           enum: [flash_sale, discount_program]
 *         description: Filter products by promotion type.
 *     responses:
 *       200:
 *         description: List of products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 *   post:
 *     summary: Create a new product
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       201:
 *         description: Product created
 */

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get all orders
 *     responses:
 *       200:
 *         description: List of orders
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 *   post:
 *     summary: Create a new order
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Order'
 *     responses:
 *       201:
 *         description: Order created
 */

/**
 * @swagger
 * /api/coupons:
 *   get:
 *     summary: Get all coupons
 *     responses:
 *       200:
 *         description: List of coupons
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Coupon'
 *   post:
 *     summary: Create a new coupon
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Coupon'
 *     responses:
 *       201:
 *         description: Coupon created
 */

/**
 * @swagger
 * /api/comments:
 *   get:
 *     summary: Get all comments
 *     responses:
 *       200:
 *         description: List of comments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Comment'
 *   post:
 *     summary: Create a new comment
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Comment'
 *     responses:
 *       201:
 *         description: Comment created
 * /api/comments/{id}:
 *   get:
 *     summary: Get comment by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Comment details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *   put:
 *     summary: Update comment
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Comment'
 *     responses:
 *       200:
 *         description: Comment updated
 *   delete:
 *     summary: Delete comment
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Comment deleted
 */

/**
 * @swagger
 * /api/post-metas:
 *   get:
 *     summary: Get all post metas
 *     responses:
 *       200:
 *         description: List of post metas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PostMeta'
 *   post:
 *     summary: Create a new post meta
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PostMeta'
 *     responses:
 *       201:
 *         description: PostMeta created
 * /api/post-metas/{id}:
 *   get:
 *     summary: Get post meta by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: PostMeta details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PostMeta'
 *   put:
 *     summary: Update post meta
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PostMeta'
 *     responses:
 *       200:
 *         description: PostMeta updated
 *   delete:
 *     summary: Delete post meta
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: PostMeta deleted
 */

/**
 * @swagger
 * /api/product-images:
 *   get:
 *     summary: Get all product images
 *     responses:
 *       200:
 *         description: List of product images
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ProductImage'
 *   post:
 *     summary: Create a new product image
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductImage'
 *     responses:
 *       201:
 *         description: ProductImage created
 * /api/product-images/{id}:
 *   get:
 *     summary: Get product image by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: ProductImage details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductImage'
 *   put:
 *     summary: Update product image
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductImage'
 *     responses:
 *       200:
 *         description: ProductImage updated
 *   delete:
 *     summary: Delete product image
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: ProductImage deleted
 */

/**
 * @swagger
 * /api/product-variants:
 *   get:
 *     summary: Get all product variants
 *     responses:
 *       200:
 *         description: List of product variants
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ProductVariant'
 *   post:
 *     summary: Create a new product variant
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductVariant'
 *     responses:
 *       201:
 *         description: ProductVariant created
 * /api/product-variants/{id}:
 *   get:
 *     summary: Get product variant by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: ProductVariant details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductVariant'
 *   put:
 *     summary: Update product variant
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductVariant'
 *     responses:
 *       200:
 *         description: ProductVariant updated
 *   delete:
 *     summary: Delete product variant
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: ProductVariant deleted
 */

/**
 * @swagger
 * /api/variant-options:
 *   get:
 *     summary: Get all variant options
 *     responses:
 *       200:
 *         description: List of variant options
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/VariantOption'
 *   post:
 *     summary: Create a new variant option
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VariantOption'
 *     responses:
 *       201:
 *         description: VariantOption created
 * /api/variant-options/{id}:
 *   get:
 *     summary: Get variant option by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: VariantOption details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VariantOption'
 *   put:
 *     summary: Update variant option
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VariantOption'
 *     responses:
 *       200:
 *         description: VariantOption updated
 *   delete:
 *     summary: Delete variant option
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: VariantOption deleted
 */

/**
 * @swagger
 * /api/order-items:
 *   get:
 *     summary: Get all order items
 *     responses:
 *       200:
 *         description: List of order items
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/OrderItem'
 *   post:
 *     summary: Create a new order item
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OrderItem'
 *     responses:
 *       201:
 *         description: OrderItem created
 * /api/order-items/{id}:
 *   get:
 *     summary: Get order item by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: OrderItem details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrderItem'
 *   put:
 *     summary: Update order item
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OrderItem'
 *     responses:
 *       200:
 *         description: OrderItem updated
 *   delete:
 *     summary: Delete order item
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: OrderItem deleted
 */
