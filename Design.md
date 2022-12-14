# ecommercesite

# Ecommerce Site

## Product Ideas
- Shoes
- Clothing accessories
- books
- Clothe: graphic tees, men's athletic wear

## Features

- Sale team user can add/remove products
	- Sale team account must be approved by admin
	- Adding product includes putting/changing the total quantity of the product
		- If there are variations of a product then quantity must be provided for each variation
		- Each item must have a unique product number. Maybe 12 digits with last 3 digits representing a variation(generated by database)
	- sale team can login/logout

- Customer user can make an account
	- Login with username,password
	- Login with gmail
	- track their transaction history
	- track their carts and checkout with saved payment credentials(maybe)
	- delete/edit their account
	- favorite/wishlist certain products and be able to go back and add to cart or checkout(later feature)
	- account can be deleted by admin
- User can see a specific product in more detail
	- Product page shows the price of the product, including old price if on sale
	- Product page shows different images of product
	- Product page has sizes if the product is a clothing item
	- Product page has checkout and add to cart buttons
	- Product page may contain a description of the product
- User can see their cart and what items they have in there
	- User can delete their cart items or empty the cart
	- User can increase the quanitity of their item as long as it is below amount in stock
		- User can have quantity of 1 or more of a product or they must delete
	- User can checkout their cart items
		- Checking out a cart takes user to a checkout screen where the products are listed
- User can leave product reviews
	- Products have star rating
	- Must be a user that purchased that product previously
	- product reviews shown at the bottom of the product page
	- product reviews can be sorted by rating or recency
	- Maybe have heading 

## Employee Dashboard(Admin, Sale Team Member(STM))
- Look
	- vary dark blue background, purple-gray text for navigation panel
- Menu options
	- Dashboard- shows some analytics, use apexcharts
		- Chart one: Top 5 selling products
		- Chart Two: Past 5 days daily transaction totals. Maybe option to make it more
	- Products- shows the products themselves, can be edited
	- Inventory-shows products and their quantity(sold/in stock)
	- Orders(admin only?)-Shows
	- purchase orders(later feature)
	- Settings
 
## Additional features for later

- Guest customer user
	- Can add to cart(later feature) and checkout product items
	- Can also leave a review on a product but only right after they complete their purchase
		- Should try and see if it would be possible for them to come back and leave review as well
- User can browse products and filter them
	- They can sort by price(low, high), popularity(?), and data added to site
	- They can sort by product type(ex. if clothing men, women, girl, boy)
	- They can filter by Brand, category, or price range
	
- User gets a confirmation number and an email upon checkout
	- Email will include confirmation number along with product transaction summary
	- Email will also be sent out to customer when theur product is shipped out
- sale team can add tags to products
	- tags can be things like shirt,white(color),logo,and other things that can be used to better filter the product
	- Tags along with categories are used to generate related products section

## Database

\* quantity is either sum of product variation count or just product count
\*\*transaction_status can be refunded,complete,pending)

- user(email,password)
- employee(employee_number, first_name, last_name, email, role)
- product(name, product number, quantity*, quantity_sold, date_added, status, price,description,weight, review_rating, review_count)
- Xproduct_item(product_id,item_id, status,)
- product_image(product_id, is_main_image,link)
- ?product_variation(product_id, product_size, price)
- customer(first_name, last_name, phone_number, email, address, city, state, zip_code)
- transaction(product_item_id, customer_id, sale_price, total_price_before_tax, total_price_after_tax,transaction_date, transaction_time?, transaction_status**,confirmation_number,shipping_address, shipping_zip_code,shipping_city,shipping_state,shipping_country, estimated_delivery_date )
- order_line(product_id,transaction_id, order_line_id, quantity, weight,price_before_tax, price_after_tax)
- Xadmin(employee_id,first_name,last_name,emai)
- Xseller_team_member(employee_id,first_name,last_name,email)
- category(name,status)
- product_category(category_id,product_id)
- ?tag(name)
- ?product_tag(product_id,tag_id)
- customer_cart_item(customer_id, product_id)
- product_review(customer_id, product_id,rating, review_heading,comment)
 
