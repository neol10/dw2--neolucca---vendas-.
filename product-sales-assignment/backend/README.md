# Product Sales Assignment Backend

## Overview
This backend project is built using FastAPI and SQLAlchemy to manage product sales. It provides a RESTful API for handling product-related operations such as creating, updating, deleting, and fetching products.

## Project Structure
- **src/**: Contains the main application code.
  - **app.py**: Entry point of the FastAPI application.
  - **controllers/**: Contains the logic for handling product requests.
  - **models/**: Defines the database models.
  - **routes/**: Contains the API routes.
  - **types/**: Exports types and interfaces used throughout the backend.
- **requirements.txt**: Lists the dependencies required for the backend.
- **database.py**: Handles the database connection and setup.
- **seed.py**: Seeds the database with initial product data.

## Setup Instructions
1. Clone the repository:
   ```
   git clone <repository-url>
   cd product-sales-assignment/backend
   ```

2. Install the required dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Run the application:
   ```
   uvicorn src.app:app --reload
   ```

4. Access the API at `http://127.0.0.1:8000`.

## API Endpoints
- `GET /products`: Fetch all products.
- `POST /products`: Create a new product.
- `PUT /products/{id}`: Update an existing product.
- `DELETE /products/{id}`: Delete a product.

## Database
The application uses SQLite for the database. The database file will be created automatically if it does not exist.

## Seeding the Database
To seed the database with initial product data, run:
```
python seed.py
```

## License
This project is licensed under the MIT License.