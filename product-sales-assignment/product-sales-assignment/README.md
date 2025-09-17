# Product Sales Assignment

## Overview
This project is a bimonthly IT assignment focused on product sales, featuring a full-stack application with a backend built using FastAPI and a frontend developed with React. The application allows users to view, create, update, and delete products.

## Project Structure
The project is organized into two main directories: `backend` and `frontend`.

### Backend
- **src/app.py**: Entry point of the FastAPI application, initializes the app, sets up middleware, and includes product routes.
- **src/controllers/productController.py**: Contains functions to handle product-related requests.
- **src/models/product.py**: Defines the Product model using SQLAlchemy.
- **src/routes/productRoutes.py**: Exports routes for product-related API endpoints.
- **src/types/index.py**: Exports types and interfaces used throughout the backend.
- **requirements.txt**: Lists dependencies required for the backend.
- **database.py**: Handles the database connection and setup for SQLite.
- **seed.py**: Seeds the database with initial product data.

### Frontend
- **src/index.html**: Main HTML file for the frontend application.
- **src/styles.css**: CSS styles for the frontend, utilizing Grid and Flexbox.
- **src/scripts.js**: JavaScript code for fetching data from the API and managing user interactions.
- **package.json**: Configuration file for npm, listing dependencies and scripts.
- **tsconfig.json**: Configuration file for TypeScript.

## Setup Instructions

### Backend
1. Navigate to the `backend` directory.
2. Install the required dependencies:
   ```
   pip install -r requirements.txt
   ```
3. Run the FastAPI application:
   ```
   uvicorn src.app:app --reload
   ```

### Frontend
1. Navigate to the `frontend` directory.
2. Install the required dependencies:
   ```
   npm install
   ```
3. Start the frontend application:
   ```
   npm start
   ```

## Features
- View a list of products.
- Add new products to the inventory.
- Update existing product details.
- Delete products from the inventory.

## Contributing
Contributions are welcome! Please feel free to submit a pull request or open an issue for any suggestions or improvements.

## License
This project is licensed under the MIT License.